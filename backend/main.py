"""Engineering Performance Dashboard — FastAPI backend (Calculation Engine API)."""
from contextlib import asynccontextmanager
from datetime import date, datetime
from io import BytesIO
from typing import Any, Literal

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

from .security import get_current_user, get_editor, get_quality_editor, load_env

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
                for i in ISSUES
            ]
            await db.replace_all_in("issues", seed_issues)
        if await db.count_rows_in("tools") == 0:
            await db.replace_all_in("tools", TOOLS)
        if await db.count_rows_in("improvements") == 0:
            await db.replace_all_in("improvements", IMPROVEMENTS)

        sync_issues(await db.list_rows("issues"))
        sync_tools(await db.list_rows("tools"))
        sync_improvements(await db.list_rows("improvements"))
        yield
    finally:
        await db.close_db()


app = FastAPI(title="Engineering Performance API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3011", "http://127.0.0.1:3011"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=False,
)

LINES = ["AC SPLIT", "AC PORTABLE", "WASHING MACHINE", "AC COMERCIAL"]

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
}

# Baris hasil parse impor excel, ditahan sampai /api/impor-excel/commit.
PENDING_ROWS: list[dict[str, Any]] = []


class RawDataRow(BaseModel):
    """Satu baris raw data dari input manual. Semua angka >= 0, line terdaftar, date ISO."""
    date: str
    model: str
    line: str
    input_qty: int = Field(ge=0)
    first_pass_good_qty: int = Field(ge=0)
    defect_qty: int = Field(ge=0)
    planned_minutes: float = Field(ge=0)
    downtime_minutes: float = Field(ge=0)
    target_ct_sec: float = Field(ge=0)
    actual_ct_sec: float = Field(ge=0)
    standard_setup_min: float = Field(ge=0)
    actual_setup_min: float = Field(ge=0)

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


@app.get("/api/kpi", dependencies=[Depends(get_current_user)])
def api_kpi() -> dict:
    """Ringkasan seluruh KPI inti engineering + setup time."""
    return kalkulasi_kpi(RAW)


@app.get("/api/trend", dependencies=[Depends(get_current_user)])
def api_trend() -> list[dict]:
    return ambil_tren()


@app.get("/api/pareto", dependencies=[Depends(get_current_user)])
def api_pareto() -> list[dict]:
    return ambil_pareto()


@app.get("/api/defect-per-line", dependencies=[Depends(get_current_user)])
def api_defect_per_line() -> list[dict]:
    return ambil_defect_per_line()


@app.get("/api/process", dependencies=[Depends(get_current_user)])
def api_process() -> dict:
    return {
        "station_balance": STATION_BALANCE,
        "setup_trend": setup_per_day(),
        "cycle_achievement": cycle_achievement_per_day(),
    }


@app.get("/api/quality", dependencies=[Depends(get_current_user)])
def api_quality() -> dict:
    return fpy_defect_daily()


@app.get("/api/engineering", dependencies=[Depends(get_current_user)])
async def api_engineering() -> dict:
    """Issues, tools, improvements terkini dari DB (persisten)."""
    return {
        "issues": await db.list_rows("issues"),
        "tools": await db.list_rows("tools"),
        "improvements": await db.list_rows("improvements"),
    }


@app.post("/api/engineering/issues", dependencies=[Depends(get_editor)])
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


@app.post("/api/engineering/tools", dependencies=[Depends(get_editor)])
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


@app.post("/api/engineering/improvements", dependencies=[Depends(get_editor)])
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


@app.post("/api/quality/defects", dependencies=[Depends(get_quality_editor)])
async def tambah_defect(payload: DefectIn) -> dict:
    return await db.insert_row_in("defects", payload.model_dump())


@app.delete("/api/quality/defects/{defect_id}", dependencies=[Depends(get_quality_editor)])
async def hapus_defect(defect_id: int) -> dict:
    if not await db.delete_row_in("defects", defect_id):
        raise HTTPException(status_code=404, detail=f"Defect {defect_id} tidak ditemukan")
    return {"deleted": True, "id": defect_id}


@app.get("/api/raw-data", dependencies=[Depends(get_current_user)])
def daftar_raw_data() -> dict:
    """Seluruh isi RAW saat ini."""
    return {"total_rows": len(RAW), "rows": RAW}


@app.post("/api/raw-data", dependencies=[Depends(get_editor)])
async def tambah_raw_data(row: RawDataRow) -> dict:
    """Input manual satu baris raw data, langsung masuk ke RAW + DB."""
    data = row.model_dump()
    RAW.append(data)
    await db.insert_row(data)
    return {"saved": True, "total_rows": len(RAW), "kpi": kalkulasi_kpi(RAW)}


@app.post("/api/raw-data/reset", dependencies=[Depends(get_editor)])
async def reset_raw_data() -> dict:
    """Kembalikan RAW ke kondisi seed awal (DB ikut di-sync)."""
    n = reset_raw()
    await db.replace_all(RAW)
    return {"reset": True, "total_rows": n}


@app.post("/api/impor-excel", dependencies=[Depends(get_editor)])
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
        if line not in LINES:
            warnings.append(f"Baris {excel_row_no}: line tidak dikenal ({line!r})")
            continue
        if not model:
            warnings.append(f"Baris {excel_row_no}: model kosong")
            continue
        rec["line"] = line
        rec["model"] = model
        parsed.append(rec)

    global PENDING_ROWS
    PENDING_ROWS = parsed

    return {
        "total_rows": len(parsed),
        "preview": parsed[:5],
        "columns": [c for c in REQUIRED_COLUMNS if c in mapping],
        "warnings": warnings,
    }


@app.post("/api/impor-excel/commit", dependencies=[Depends(get_editor)])
async def commit_impor_excel() -> dict:
    """Pindahkan PENDING_ROWS ke RAW lalu hitung ulang KPI."""
    global PENDING_ROWS
    if not PENDING_ROWS:
        raise HTTPException(status_code=400, detail="Tidak ada data pending, upload dulu")
    n = len(PENDING_ROWS)
    for r in PENDING_ROWS:
        await db.insert_row(r)
    RAW.extend(PENDING_ROWS)
    PENDING_ROWS = []
    return {"saved": n, "total_rows": len(RAW), "kpi": kalkulasi_kpi(RAW)}
