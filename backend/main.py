"""Engineering Performance Dashboard — FastAPI backend (Calculation Engine API)."""
from contextlib import asynccontextmanager
from datetime import date, datetime
from io import BytesIO
import os
from typing import Any, Literal

from fastapi import Depends, FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, Field, field_validator, model_validator

from .ratelimit import RateLimiter
from .security import (
    get_current_user,
    get_editor,
    get_quality_editor,
    get_admin,
    load_env,
)
from .users import (
    seed_default_users,
    hash_password,
    verify_password,
    public_user,
    VALID_ROLES as USER_ROLES,
)

load_env()

from . import db
from .engine import (
    RAW,
    STATION_BALANCE,
    ISSUES,
    TOOLS,
    IMPROVEMENTS,
    kalkulasi_kpi,
    ambil_tren,
    ambil_pareto,
    ambil_defect_per_line,
    setup_per_day,
    cycle_achievement_per_day,
    fpy_defect_daily,
    reset_raw,
    sync_issues,
    sync_tools,
    sync_improvements,
)

@asynccontextmanager
async def lifespan(_: FastAPI):
    """Startup: pastikan DB (PostgreSQL) terisi seed, lalu muat isi DB ke RAW + data engineering.

    RAW dan ISSUES/TOOLS/IMPROVEMENTS tetap source-of-truth runtime di memori;
    DB hanya persistensi.
    """
    await db.init_db()
    try:
        if await db.count_rows() == 0:
            await db.replace_all(RAW)
        else:
            RAW[:] = await db.load_rows()

        if await db.count_rows_in("issues") == 0:
            seed_issues = [
                {
                    "eng_id": i["id"],
                    "title": i["title"],
                    "line": i["line"],
                    "owner": i["owner"],
                    "priority": i["priority"],
                    "status": i["status"],
                    "due_date": i["due_date"],
                }
                for i in _SEED_ISSUES
            ]
            await db.replace_all_in("issues", seed_issues)
        if await db.count_rows_in("tools") == 0:
            await db.replace_all_in("tools", _SEED_TOOLS)
        if await db.count_rows_in("improvements") == 0:
            await db.replace_all_in("improvements", _SEED_IMPROVEMENTS)

        await seed_default_users()

        sync_issues(await db.list_rows("issues"))
        sync_tools(await db.list_rows("tools"))
        sync_improvements(await db.list_rows("improvements"))
        yield
    finally:
        await db.close_db()


app = FastAPI(title="Engineering Performance API", version="1.0.0", lifespan=lifespan)

_allowed_origins = os.environ.get("ALLOWED_ORIGINS") or "http://localhost:3011,http://127.0.0.1:3011"
ALLOWED_ORIGINS = [_o.strip() for _o in _allowed_origins.split(",") if _o.strip()]
if "*" in ALLOWED_ORIGINS:
    ALLOWED_ORIGINS = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=False,
)

LINES = ["IDU", "ODU", "LINE 1"]
UNIT_CATEGORIES = ["AC SPLIT", "AC PORTABLE", "WASHING MACHINE", "AC COMERCIAL"]

# Snapshot seed engineering asli (sebelum sync/clear memutasi ISSUES/TOOLS/IMPROVEMENTS)
# — dipakai reset untuk memulihkan demo.
_SEED_ISSUES = [dict(i) for i in ISSUES]
_SEED_TOOLS = [dict(t) for t in TOOLS]
_SEED_IMPROVEMENTS = [dict(i) for i in IMPROVEMENTS]

NUMERIC_COLUMNS = [
    "input_qty",
    "first_pass_good_qty",
    "defect_qty",
    "planned_minutes",
    "downtime_minutes",
    "target_ct_sec",
    "actual_ct_sec",
    "standard_setup_min",
    "actual_setup_min",
]
TEXT_COLUMNS = ["date", "model", "line"]
REQUIRED_COLUMNS = NUMERIC_COLUMNS + TEXT_COLUMNS

COLUMN_ALIASES: dict[str, list[str]] = {
    "input_qty": ["input_qty", "input", "qty_input", "input_quantity", "jumlah_input", "qty"],
    "first_pass_good_qty": ["first_pass_good_qty", "first_pass", "fpy_good", "fpy", "good_qty",
                            "first_pass_qty", "fpy_qty"],
    "defect_qty": ["defect_qty", "defect", "qty_defect", "defects", "jumlah_defect", "defect_count"],
    "planned_minutes": ["planned_minutes", "planned", "plan_min", "planned_time", "planned_min"],
    "downtime_minutes": ["downtime_minutes", "downtime", "down_time", "dt_min", "downtime_min"],
    "target_ct_sec": ["target_ct_sec", "target_ct", "target_cycle_time", "ct_target", "target_ct_s"],
    "actual_ct_sec": ["actual_ct_sec", "actual_ct", "actual_cycle_time", "ct_actual", "actual_ct_s"],
    "standard_setup_min": ["standard_setup_min", "standard_setup", "std_setup", "setup_standard",
                           "std_setup_min", "setup_standard_min"],
    "actual_setup_min": ["actual_setup_min", "actual_setup", "act_setup", "setup_actual",
                         "act_setup_min", "setup_actual_min"],
    "date": ["date", "tanggal", "day", "tanggal_produksi", "production_date"],
    "model": ["model", "model_name", "product", "produk", "product_name"],
    "line": ["line", "lini", "production_line", "line_name"],
    "category": ["category", "kategori", "unit_type", "tipe_unit"],
}

# Baris hasil parse impor excel, ditahan sampai /api/impor-excel/commit.
PENDING_ROWS: list[dict[str, Any]] = []

# Rate limit anti brute-force. Per-proses: dengan uvicorn --workers 2, tiap
# worker punya counter sendiri (acceptable untuk ketelitian sederhana).
LOGIN_LIMIT_MAX = 5
LOGIN_LIMIT_WINDOW = 60
LOGIN_LIMIT_LOCKOUT = 900  # 15 menit
login_limiter = RateLimiter(LOGIN_LIMIT_MAX, LOGIN_LIMIT_WINDOW, LOGIN_LIMIT_LOCKOUT)

# Limiter ringan untuk semua POST non-login; threshold tinggi agar tidak
# menolak impor excel besar.
general_limiter = RateLimiter(max_attempts=120, window_seconds=60, lockout_seconds=60)


def _client_key(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def rate_limit_general(request: Request) -> None:
    """Dependency: batasi POST umum 120 req/menit per IP."""
    allowed, retry_after = general_limiter.hit(_client_key(request))
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail=f"Terlalu banyak permintaan, coba lagi dalam {retry_after} detik",
        )


class RawDataRow(BaseModel):
    """Satu baris raw data dari input manual. Semua angka >= 0, line terdaftar, date ISO."""
    date: str
    model: str
    line: str
    category: str = ""
    input_qty: int = Field(ge=0)
    first_pass_good_qty: int = Field(ge=0)
    defect_qty: int = Field(ge=0)
    planned_minutes: float = Field(ge=0)
    downtime_minutes: float = Field(ge=0)
    target_ct_sec: float = Field(ge=0)
    actual_ct_sec: float = Field(ge=0)
    standard_setup_min: float = Field(ge=0)
    actual_setup_min: float = Field(ge=0)

    @field_validator("category")
    @classmethod
    def _validasi_kategori(cls, v: str) -> str:
        v = v.strip().upper()
        if v not in ("", *UNIT_CATEGORIES):
            raise ValueError(f"category tidak dikenal: {v!r}. Pilihan: {UNIT_CATEGORIES}")
        return v

    @field_validator("date")
    @classmethod
    def _validasi_tanggal_iso(cls, v: str) -> str:
        date.fromisoformat(v)
        return v

    @field_validator("line")
    @classmethod
    def _validasi_line(cls, v: str) -> str:
        v = v.strip()
        if v not in LINES:
            raise ValueError(f"line tidak dikenal: {v!r}. Pilihan: {LINES}")
        return v

    @model_validator(mode="after")
    def _cek_konsistensi_fpg(self) -> "RawDataRow":
        if self.first_pass_good_qty + self.defect_qty > self.input_qty:
            raise ValueError("first_pass_good_qty + defect_qty tidak boleh melebihi input_qty")
        return self


def _koersi_tanggal(v: Any) -> str:
    """Normalisasi nilai tanggal dari excel (str / datetime / Timestamp) jadi ISO string."""
    if isinstance(v, datetime):
        return v.date().isoformat()
    if hasattr(v, "date") and hasattr(v, "to_pydatetime"):
        return v.to_pydatetime().date().isoformat()
    return date.fromisoformat(str(v).strip()).isoformat()


ISSUE_PRIORITIES = ("high", "medium", "low")
ISSUE_STATUSES = ("open", "progress", "closed")


class IssueIn(BaseModel):
    title: str = Field(min_length=1)
    line: str
    owner: str = Field(min_length=1)
    priority: Literal["high", "medium", "low"]
    status: Literal["open", "progress", "closed"]
    due_date: str

    @field_validator("due_date")
    @classmethod
    def _validasi_tanggal_iso(cls, v: str) -> str:
        date.fromisoformat(v)
        return v


class ToolIn(BaseModel):
    name: str = Field(min_length=1)
    planned_hours: float = Field(ge=0)
    actual_available_hours: float = Field(ge=0)


class ImprovementIn(BaseModel):
    title: str = Field(min_length=1)
    baseline: float = Field(ge=0)
    after: float = Field(ge=0)
    unit: str = Field(min_length=1)


class DefectIn(BaseModel):
    date: str
    line: str
    model: str = Field(min_length=1)
    defect_type: str = Field(min_length=1)
    qty: int = Field(ge=1)

    @field_validator("date")
    @classmethod
    def _validasi_tanggal_iso(cls, v: str) -> str:
        date.fromisoformat(v)
        return v

    @field_validator("line")
    @classmethod
    def _validasi_line(cls, v: str) -> str:
        v = v.strip()
        if v not in LINES:
            raise ValueError(f"line tidak dikenal: {v!r}. Pilihan: {LINES}")
        return v


async def _next_eng_id() -> str:
    max_n = 0
    for row in await db.list_rows("issues"):
        eng = row.get("eng_id", "")
        if eng.startswith("ENG-") and eng[4:].isdigit():
            max_n = max(max_n, int(eng[4:]))
    return f"ENG-{max_n + 1}"


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "engine": "calculation-engine-v1"}


async def _sync_runtime() -> None:
    """Reload RAW + data engineering dari DB — memastikan konsistensi antar worker."""
    RAW[:] = await db.load_rows()
    sync_issues(await db.list_rows("issues"))
    sync_tools(await db.list_rows("tools"))
    sync_improvements(await db.list_rows("improvements"))


@app.get("/api/kpi", dependencies=[Depends(get_current_user)])
async def api_kpi() -> dict:
    """Ringkasan seluruh KPI inti engineering + setup time."""
    await _sync_runtime()
    return kalkulasi_kpi(RAW)


@app.get("/api/trend", dependencies=[Depends(get_current_user)])
async def api_trend() -> list[dict]:
    await _sync_runtime()
    return ambil_tren()


@app.get("/api/pareto", dependencies=[Depends(get_current_user)])
async def api_pareto() -> list[dict]:
    await _sync_runtime()
    return ambil_pareto()


@app.get("/api/defect-per-line", dependencies=[Depends(get_current_user)])
async def api_defect_per_line() -> list[dict]:
    await _sync_runtime()
    return ambil_defect_per_line()


@app.get("/api/process", dependencies=[Depends(get_current_user)])
async def api_process() -> dict:
    await _sync_runtime()
    return {
        "station_balance": STATION_BALANCE,
        "setup_trend": setup_per_day(),
        "cycle_achievement": cycle_achievement_per_day(),
    }


@app.get("/api/quality", dependencies=[Depends(get_current_user)])
async def api_quality() -> dict:
    await _sync_runtime()
    return fpy_defect_daily()


@app.get("/api/engineering", dependencies=[Depends(get_current_user)])
async def api_engineering() -> dict:
    """Issues, tools, improvements terkini dari DB (persisten)."""
    return {
        "issues": await db.list_rows("issues"),
        "tools": await db.list_rows("tools"),
        "improvements": await db.list_rows("improvements"),
    }


@app.post("/api/engineering/issues", dependencies=[Depends(get_editor), Depends(rate_limit_general)])
async def tambah_issue(payload: IssueIn) -> dict:
    row = await db.insert_row_in(
        "issues",
        {**payload.model_dump(), "eng_id": await _next_eng_id()},
    )
    sync_issues(await db.list_rows("issues"))
    return row


@app.put("/api/engineering/issues/{issue_id}", dependencies=[Depends(get_editor)])
async def ubah_issue(issue_id: int, payload: dict[str, Any]) -> dict:
    existing = await db.get_row_in("issues", issue_id)
    if existing is None:
        raise HTTPException(status_code=404, detail=f"Issue {issue_id} tidak ditemukan")
    allowed = {"title", "line", "owner", "priority", "status", "due_date"}
    bad = set(payload) - allowed
    if bad:
        raise HTTPException(status_code=422, detail=f"Field tidak dikenal: {sorted(bad)}")
    merged = {k: v for k, v in payload.items() if v is not None}
    for field in ("priority", "status"):
        if field in merged and merged[field] not in (ISSUE_PRIORITIES if field == "priority" else ISSUE_STATUSES):
            raise HTTPException(status_code=422, detail=f"nilai {field} tidak valid")
    if "due_date" in merged:
        try:
            date.fromisoformat(str(merged["due_date"]))
        except ValueError:
            raise HTTPException(status_code=422, detail="due_date harus format ISO (YYYY-MM-DD)")
    updated = await db.update_row_in("issues", issue_id, merged)
    sync_issues(await db.list_rows("issues"))
    return updated


@app.delete("/api/engineering/issues/{issue_id}", dependencies=[Depends(get_editor)])
async def hapus_issue(issue_id: int) -> dict:
    if not await db.delete_row_in("issues", issue_id):
        raise HTTPException(status_code=404, detail=f"Issue {issue_id} tidak ditemukan")
    sync_issues(await db.list_rows("issues"))
    return {"deleted": True, "id": issue_id}


@app.post("/api/engineering/tools", dependencies=[Depends(get_editor), Depends(rate_limit_general)])
async def tambah_tool(payload: ToolIn) -> dict:
    row = await db.insert_row_in("tools", payload.model_dump())
    sync_tools(await db.list_rows("tools"))
    return row


@app.put("/api/engineering/tools/{tool_id}", dependencies=[Depends(get_editor)])
async def ubah_tool(tool_id: int, payload: dict[str, Any]) -> dict:
    existing = await db.get_row_in("tools", tool_id)
    if existing is None:
        raise HTTPException(status_code=404, detail=f"Tool {tool_id} tidak ditemukan")
    allowed = {"name", "planned_hours", "actual_available_hours"}
    bad = set(payload) - allowed
    if bad:
        raise HTTPException(status_code=422, detail=f"Field tidak dikenal: {sorted(bad)}")
    updated = await db.update_row_in("tools", tool_id, {k: v for k, v in payload.items() if v is not None})
    sync_tools(await db.list_rows("tools"))
    return updated


@app.delete("/api/engineering/tools/{tool_id}", dependencies=[Depends(get_editor)])
async def hapus_tool(tool_id: int) -> dict:
    if not await db.delete_row_in("tools", tool_id):
        raise HTTPException(status_code=404, detail=f"Tool {tool_id} tidak ditemukan")
    sync_tools(await db.list_rows("tools"))
    return {"deleted": True, "id": tool_id}


@app.post("/api/engineering/improvements", dependencies=[Depends(get_editor), Depends(rate_limit_general)])
async def tambah_improvement(payload: ImprovementIn) -> dict:
    row = await db.insert_row_in("improvements", payload.model_dump())
    sync_improvements(await db.list_rows("improvements"))
    return row


@app.delete("/api/engineering/improvements/{improvement_id}", dependencies=[Depends(get_editor)])
async def hapus_improvement(improvement_id: int) -> dict:
    if not await db.delete_row_in("improvements", improvement_id):
        raise HTTPException(status_code=404, detail=f"Improvement {improvement_id} tidak ditemukan")
    sync_improvements(await db.list_rows("improvements"))
    return {"deleted": True, "id": improvement_id}


@app.get("/api/quality/defects", dependencies=[Depends(get_current_user)])
async def daftar_defects() -> dict:
    rows = await db.list_rows("defects")
    return {"total": len(rows), "rows": rows}


@app.post("/api/quality/defects", dependencies=[Depends(get_quality_editor), Depends(rate_limit_general)])
async def tambah_defect(payload: DefectIn) -> dict:
    return await db.insert_row_in("defects", payload.model_dump())


@app.delete("/api/quality/defects/{defect_id}", dependencies=[Depends(get_quality_editor)])
async def hapus_defect(defect_id: int) -> dict:
    if not await db.delete_row_in("defects", defect_id):
        raise HTTPException(status_code=404, detail=f"Defect {defect_id} tidak ditemukan")
    return {"deleted": True, "id": defect_id}


class LoginIn(BaseModel):
    username: str = Field(min_length=1)
    password: str = Field(min_length=1)


@app.post("/api/auth/login")
async def api_login(payload: LoginIn, request: Request) -> dict:
    """Verifikasi kredensial terhadap akun di DB (PBKDF2). Dipanggil route handler frontend."""
    key = _client_key(request)
    allowed, retry_after = login_limiter.check(key)
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail=f"Terlalu banyak percobaan, coba lagi dalam {retry_after} detik",
        )
    username = payload.username.strip()
    rows = await db.list_rows("users")
    user = next((r for r in rows if r["username"] == username), None)
    if user is None or not verify_password(payload.password, user["salt"], user["hash"]):
        allowed, retry_after = login_limiter.record_failure(key)
        if not allowed:
            raise HTTPException(
                status_code=429,
                detail=f"Terlalu banyak percobaan, coba lagi dalam {retry_after} detik",
            )
        raise HTTPException(status_code=401, detail="Username atau password salah")
    login_limiter.reset(key)
    return {"ok": True, "username": username, "role": user["role"]}


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=32)
    password: str = Field(min_length=4)
    role: Literal["admin", "engineer", "viewer", "qc"]


class UserRoleUpdate(BaseModel):
    role: Literal["admin", "engineer", "viewer", "qc"]


class PasswordChange(BaseModel):
    old_password: str = Field(min_length=1)
    new_password: str = Field(min_length=6)


@app.post("/api/auth/change-password", dependencies=[Depends(get_current_user), Depends(rate_limit_general)])
async def ubah_password_sendiri(payload: PasswordChange, user: dict = Depends(get_current_user)) -> dict:
    rows = await db.list_rows("users")
    target = next((r for r in rows if r["username"] == user["sub"]), None)
    if target is None:
        raise HTTPException(status_code=404, detail="Akun tidak ditemukan")
    if not verify_password(payload.old_password, target["salt"], target["hash"]):
        raise HTTPException(status_code=400, detail="Password lama salah")
    salt, pw_hash = hash_password(payload.new_password)
    await db.update_row_in("users", target["id"], {"salt": salt, "hash": pw_hash})
    return {"ok": True}


@app.get("/api/users", dependencies=[Depends(get_admin)])
async def daftar_users() -> dict:
    rows = await db.list_rows("users")
    return {"users": [public_user(r) for r in rows]}


@app.post("/api/users", dependencies=[Depends(get_admin), Depends(rate_limit_general)])
async def tambah_user(payload: UserCreate) -> dict:
    username = payload.username.strip().lower()
    if not username:
        raise HTTPException(status_code=422, detail="Username tidak boleh kosong")
    existing = await db.list_rows("users")
    if any(r["username"] == username for r in existing):
        raise HTTPException(status_code=409, detail=f"Username '{username}' sudah dipakai")
    salt, pw_hash = hash_password(payload.password)
    row = await db.insert_row_in(
        "users", {"username": username, "salt": salt, "hash": pw_hash, "role": payload.role}
    )
    return public_user(row)


@app.put("/api/users/{username}/role", dependencies=[Depends(get_admin)])
async def ubah_role_user(username: str, payload: UserRoleUpdate) -> dict:
    rows = await db.list_rows("users")
    target = next((r for r in rows if r["username"] == username), None)
    if target is None:
        raise HTTPException(status_code=404, detail=f"User '{username}' tidak ditemukan")
    await db.update_row_in("users", target["id"], {"role": payload.role})
    return {"ok": True, "username": username, "role": payload.role}


@app.post("/api/users/{username}/password", dependencies=[Depends(get_admin), Depends(rate_limit_general)])
async def reset_password_user(username: str, payload: LoginIn) -> dict:
    rows = await db.list_rows("users")
    target = next((r for r in rows if r["username"] == username), None)
    if target is None:
        raise HTTPException(status_code=404, detail=f"User '{username}' tidak ditemukan")
    salt, pw_hash = hash_password(payload.password)
    await db.update_row_in("users", target["id"], {"salt": salt, "hash": pw_hash})
    return {"ok": True}


@app.delete("/api/users/{username}", dependencies=[Depends(get_admin)])
async def hapus_user(username: str, user: dict = Depends(get_admin)) -> dict:
    rows = await db.list_rows("users")
    target = next((r for r in rows if r["username"] == username), None)
    if target is None:
        raise HTTPException(status_code=404, detail=f"User '{username}' tidak ditemukan")
    if username == user["sub"]:
        raise HTTPException(status_code=400, detail="Tidak bisa menghapus akun sendiri")
    await db.delete_row_in("users", target["id"])
    return {"deleted": True, "username": username}


async def _upsert_raw(data: dict[str, Any]) -> None:
    """Update baris RAW kalau date+model+line sama, else tambah baru (RAW + DB)."""
    idx = next(
        (
            i
            for i, r in enumerate(RAW)
            if r["date"] == data["date"] and r["model"] == data["model"] and r["line"] == data["line"]
        ),
        None,
    )
    if idx is not None:
        RAW[idx] = data
    else:
        RAW.append(data)
    await db.upsert_row(data)


@app.get("/api/raw-data", dependencies=[Depends(get_current_user)])
async def daftar_raw_data() -> dict:
    """Seluruh isi RAW saat ini."""
    await _sync_runtime()
    return {"total_rows": len(RAW), "rows": RAW}


@app.post("/api/raw-data", dependencies=[Depends(get_editor), Depends(rate_limit_general)])
async def tambah_raw_data(row: RawDataRow) -> dict:
    """Input manual satu baris raw data. Date+model+line sama = update (backfill), else tambah baru."""
    await _upsert_raw(row.model_dump())
    return {"saved": True, "total_rows": len(RAW), "kpi": kalkulasi_kpi(RAW)}


@app.post("/api/raw-data/reset", dependencies=[Depends(get_editor), Depends(rate_limit_general)])
async def reset_raw_data() -> dict:
    """Kembalikan RAW + data engineering ke kondisi seed awal (DB ikut di-sync)."""
    n = reset_raw()
    await db.replace_all(RAW)

    seed_issues = [
        {
            "eng_id": i["id"],
            "title": i["title"],
            "line": i["line"],
            "owner": i["owner"],
            "priority": i["priority"],
            "status": i["status"],
            "due_date": i["due_date"],
        }
        for i in _SEED_ISSUES
    ]
    await db.replace_all_in("issues", seed_issues)
    await db.replace_all_in("tools", _SEED_TOOLS)
    await db.replace_all_in("improvements", _SEED_IMPROVEMENTS)
    sync_issues(await db.list_rows("issues"))
    sync_tools(await db.list_rows("tools"))
    sync_improvements(await db.list_rows("improvements"))
    return {"reset": True, "total_rows": n}


@app.post("/api/data/clear", dependencies=[Depends(get_editor), Depends(rate_limit_general)])
async def clear_mock_data() -> dict:
    """Hapus SEMUA data mock/demo: raw_data, issues, tools, improvements, defects.

    Akun user TIDAK dihapus. Setelah ini dashboard tampil 0/0% sampai data
    baru diinput (atau seed dipulihkan via /api/raw-data/reset).
    """
    RAW.clear()
    await db.replace_all(RAW)
    await db.replace_all_in("issues", [])
    await db.replace_all_in("tools", [])
    await db.replace_all_in("improvements", [])
    await db.replace_all_in("defects", [])
    sync_issues([])
    sync_tools([])
    sync_improvements([])
    return {"cleared": True, "raw_data": 0, "issues": 0, "tools": 0, "improvements": 0, "defects": 0}


@app.post("/api/impor-excel", dependencies=[Depends(get_editor), Depends(rate_limit_general)])
async def impor_excel(file: UploadFile = File(...)) -> dict:
    """Upload xlsx → parse & validasi → tampung di PENDING_ROWS (belum di-commit)."""
    try:
        import pandas as pd
    except ImportError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Pustaka pandas/openpyxl tidak tersedia: {exc}",
        ) from exc

    try:
        content = await file.read()
        df = pd.read_excel(BytesIO(content))
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"File tidak bisa dibaca sebagai Excel (pastikan .xlsx valid): {exc}",
        ) from exc

    df.columns = [str(c).strip().lower().replace(" ", "_") for c in df.columns]

    mapping: dict[str, str] = {}
    for canonical, aliases in COLUMN_ALIASES.items():
        for alias in aliases:
            if alias in df.columns:
                mapping[canonical] = alias
                break

    missing = [c for c in REQUIRED_COLUMNS if c not in mapping]
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Kolom wajib tidak ditemukan: {missing}. Kolom terbaca: {list(df.columns)}",
        )

    clean = df[[mapping[c] for c in REQUIRED_COLUMNS]].copy()
    clean.columns = REQUIRED_COLUMNS
    for col in NUMERIC_COLUMNS:
        clean[col] = pd.to_numeric(clean[col], errors="coerce")
    cat_col = mapping.get("category")
    if cat_col:
        clean["category"] = df[cat_col].astype(str).str.strip().str.upper()

    warnings: list[str] = []
    parsed: list[dict[str, Any]] = []
    for excel_row_no, r in enumerate(clean.itertuples(index=False), start=2):
        skip = None
        rec: dict[str, Any] = {}
        for col in NUMERIC_COLUMNS:
            val = getattr(r, col)
            if pd.isna(val):
                skip = f"Baris {excel_row_no}: {col} kosong/NaN"
                break
            val = float(val)
            if val < 0:
                skip = f"Baris {excel_row_no}: {col} negatif ({val})"
                break
            rec[col] = val
        if skip:
            warnings.append(skip)
            continue
        try:
            rec["date"] = _koersi_tanggal(getattr(r, "date"))
        except (ValueError, TypeError):
            warnings.append(f"Baris {excel_row_no}: date tidak valid ({getattr(r, 'date')!r})")
            continue
        line = str(getattr(r, "line")).strip()
        model = str(getattr(r, "model")).strip()
        cat = str(getattr(r, "category", "") or "").strip().upper()
        if line not in LINES:
            warnings.append(f"Baris {excel_row_no}: line tidak dikenal ({line!r})")
            continue
        if not model:
            warnings.append(f"Baris {excel_row_no}: model kosong")
            continue
        if rec["first_pass_good_qty"] + rec["defect_qty"] > rec["input_qty"]:
            warnings.append(f"Baris {excel_row_no}: first_pass_good_qty + defect_qty melebihi input_qty")
            continue
        if cat not in ("", *UNIT_CATEGORIES):
            warnings.append(
                f"Baris {excel_row_no}: category tidak dikenal ({cat!r}) — isi {UNIT_CATEGORIES}"
            )
            continue
        rec["line"] = line
        rec["model"] = model
        rec["category"] = cat
        parsed.append(rec)

    global PENDING_ROWS
    PENDING_ROWS = parsed

    return {
        "total_rows": len(parsed),
        "preview": parsed[:5],
        "columns": [c for c in REQUIRED_COLUMNS if c in mapping],
        "warnings": warnings,
    }


@app.get("/api/impor-excel/template", dependencies=[Depends(get_current_user)])
async def template_impor_excel() -> Response:
    """Unduh template Excel standar: kolom wajib + satu baris contoh."""
    import pandas as pd

    df = pd.DataFrame(columns=[*TEXT_COLUMNS, "category", *NUMERIC_COLUMNS])
    df.loc[0] = [
        date.today().isoformat(),
        "AC SPLIT 1 PK",
        "IDU",
        "AC SPLIT",
        200, 196, 3, 450, 20, 60, 63, 30, 35,
    ]
    buf = BytesIO()
    df.to_excel(buf, index=False, sheet_name="Raw Data")
    buf.seek(0)
    return Response(
        content=buf.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="template-import-raw-data.xlsx"'},
    )


@app.get("/api/raw-data/export", dependencies=[Depends(get_current_user)])
async def export_raw_data() -> Response:
    """Unduh seluruh raw data saat ini sebagai Excel."""
    import pandas as pd

    await _sync_runtime()
    df = pd.DataFrame(RAW)
    buf = BytesIO()
    df.to_excel(buf, index=False, sheet_name="Raw Data")
    buf.seek(0)
    return Response(
        content=buf.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="raw-data-export.xlsx"'},
    )


@app.post("/api/impor-excel/commit", dependencies=[Depends(get_editor), Depends(rate_limit_general)])
async def commit_impor_excel() -> dict:
    """Pindahkan PENDING_ROWS ke RAW lalu hitung ulang KPI."""
    global PENDING_ROWS
    if not PENDING_ROWS:
        raise HTTPException(status_code=400, detail="Tidak ada data pending, upload dulu")
    n = len(PENDING_ROWS)
    for r in PENDING_ROWS:
        await _upsert_raw(r)
    PENDING_ROWS = []
    return {"saved": n, "total_rows": len(RAW), "kpi": kalkulasi_kpi(RAW)}
