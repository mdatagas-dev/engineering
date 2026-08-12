"""Test API FastAPI — TestClient, DB sementara via conftest (env ENGINEERING_DB_PATH)."""
from fastapi.testclient import TestClient

from backend.main import app
from backend.tests.conftest import auth_header

KOLOM = {
    "date",
    "model",
    "line",
    "input_qty",
    "first_pass_good_qty",
    "defect_qty",
    "planned_minutes",
    "downtime_minutes",
    "target_ct_sec",
    "actual_ct_sec",
    "standard_setup_min",
    "actual_setup_min",
}


def _row_baru(line: str) -> dict:
    return {
        "date": "2026-08-11",
        "model": "Model A",
        "line": line,
        "category": "AC SPLIT",
        "input_qty": 200,
        "first_pass_good_qty": 190,
        "defect_qty": 5,
        "planned_minutes": 450,
        "downtime_minutes": 20,
        "target_ct_sec": 60,
        "actual_ct_sec": 58,
        "standard_setup_min": 30,
        "actual_setup_min": 35,
    }


def test_health_ok():
    with TestClient(app) as client:
        r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_raw_data_seeded_dan_lengkap():
    with TestClient(app) as client:
        r = client.get("/api/raw-data", headers=auth_header())
        assert r.status_code == 200
        body = r.json()
        assert body["total_rows"] > 0
        assert len(body["rows"]) == body["total_rows"]
        for baris in body["rows"]:
            assert KOLOM.issubset(baris)


def test_post_baris_line_ac_split():
    with TestClient(app) as client:
        sebelum = client.get("/api/raw-data", headers=auth_header()).json()["total_rows"]
        r = client.post("/api/raw-data", json=_row_baru("IDU"), headers=auth_header())
        assert r.status_code == 200
        body = r.json()
        assert body["saved"] is True
        assert body["total_rows"] == sebelum + 1
        assert "kpi" in body


def test_post_baris_line_lama_ditolak():
    with TestClient(app) as client:
        sebelum = client.get("/api/raw-data", headers=auth_header()).json()["total_rows"]
        r = client.post("/api/raw-data", json=_row_baru("Line 1"), headers=auth_header())
        assert r.status_code in (400, 422)
        assert client.get("/api/raw-data", headers=auth_header()).json()["total_rows"] == sebelum


def test_reset_kembali_ke_seed():
    from backend.engine import RAW

    with TestClient(app) as client:
        client.post("/api/raw-data", json=_row_baru("IDU"), headers=auth_header())
        r = client.post("/api/raw-data/reset", headers=auth_header())
        assert r.status_code == 200
        body = r.json()
        assert body["reset"] is True
        assert body["total_rows"] == len(RAW) == 270
        assert body["total_rows"] == client.get("/api/raw-data", headers=auth_header()).json()["total_rows"]


def test_persistensi_setelah_restart():
    with TestClient(app) as client:
        r = client.post("/api/raw-data", json=_row_baru("IDU"), headers=auth_header())
        assert r.status_code == 200
        total = r.json()["total_rows"]

    with TestClient(app) as client2:
        r = client2.get("/api/raw-data", headers=auth_header())
        assert r.status_code == 200
        body = r.json()
        assert body["total_rows"] == total
        assert any(b["line"] == "IDU" for b in body["rows"])


def _issue_baru() -> dict:
    return {
        "title": "Test issue baru",
        "line": "AC SPLIT",
        "owner": "Tester",
        "priority": "high",
        "status": "open",
        "due_date": "2026-09-01",
    }


def test_engineering_seeded():
    with TestClient(app) as client:
        body = client.get("/api/engineering", headers=auth_header()).json()
    assert len(body["issues"]) >= 10
    assert len(body["tools"]) >= 6
    assert len(body["improvements"]) >= 5
    assert body["issues"][0]["eng_id"].startswith("ENG-")


def test_tambah_ubah_hapus_issue():
    with TestClient(app) as client:
        r = client.post("/api/engineering/issues", json=_issue_baru(), headers=auth_header())
        assert r.status_code == 200
        baru = r.json()
        assert baru["eng_id"].startswith("ENG-")
        assert "id" in baru

        r = client.put(f"/api/engineering/issues/{baru['id']}", json={"status": "closed"}, headers=auth_header())
        assert r.status_code == 200
        assert r.json()["status"] == "closed"

        r = client.put(f"/api/engineering/issues/{baru['id']}", json={"bogus": 1}, headers=auth_header())
        assert r.status_code == 422

        r = client.delete(f"/api/engineering/issues/{baru['id']}", headers=auth_header())
        assert r.status_code == 200
        assert client.delete(f"/api/engineering/issues/{baru['id']}", headers=auth_header()).status_code == 404


def test_issue_dup_eng_id_otomatis():
    with TestClient(app) as client:
        a = client.post("/api/engineering/issues", json=_issue_baru(), headers=auth_header()).json()
        b = client.post("/api/engineering/issues", json=_issue_baru(), headers=auth_header()).json()
        assert a["eng_id"] != b["eng_id"]


def test_tool_crud():
    with TestClient(app) as client:
        r = client.post("/api/engineering/tools", json={"name": "Tool Uji", "planned_hours": 50, "actual_available_hours": 45}, headers=auth_header())
        assert r.status_code == 200
        tid = r.json()["id"]
        r = client.put(f"/api/engineering/tools/{tid}", json={"planned_hours": 60}, headers=auth_header())
        assert r.status_code == 200
        assert r.json()["planned_hours"] == 60
        assert client.delete(f"/api/engineering/tools/{tid}", headers=auth_header()).status_code == 200
        assert client.delete(f"/api/engineering/tools/{tid}", headers=auth_header()).status_code == 404


def test_improvement_crud():
    with TestClient(app) as client:
        r = client.post("/api/engineering/improvements", json={"title": "Improve Uji", "baseline": 5, "after": 2, "unit": "min"}, headers=auth_header())
        assert r.status_code == 200
        iid = r.json()["id"]
        assert client.delete(f"/api/engineering/improvements/{iid}", headers=auth_header()).status_code == 200
        assert client.delete(f"/api/engineering/improvements/{iid}", headers=auth_header()).status_code == 404


def test_defect_crud():
    with TestClient(app) as client:
        r = client.post("/api/quality/defects", json={"date": "2026-08-11", "line": "IDU", "model": "M1", "defect_type": "Goresan", "qty": 3}, headers=auth_header())
        assert r.status_code == 200
        did = r.json()["id"]
        assert client.get("/api/quality/defects", headers=auth_header()).json()["total"] == 1
        assert client.delete(f"/api/quality/defects/{did}", headers=auth_header()).status_code == 200
        assert client.get("/api/quality/defects", headers=auth_header()).json()["total"] == 0


def test_defect_validasi_qty_dan_line():
    with TestClient(app) as client:
        r = client.post("/api/quality/defects", json={"date": "2026-08-11", "line": "IDU", "model": "M1", "defect_type": "Goresan", "qty": 0}, headers=auth_header())
        assert r.status_code in (400, 422)
        r = client.post("/api/quality/defects", json={"date": "2026-08-11", "line": "Line 1", "model": "M1", "defect_type": "Goresan", "qty": 1}, headers=auth_header())
        assert r.status_code in (400, 422)


# ---------------------------------------------------------------------------
# Autentikasi: tanpa token / role viewer / token cacat.
# ---------------------------------------------------------------------------

def test_get_tanpa_token_401():
    with TestClient(app) as client:
        r = client.get("/api/raw-data")
        assert r.status_code == 401
        assert "detail" in r.json()


def test_post_tanpa_token_401():
    with TestClient(app) as client:
        r = client.post("/api/raw-data", json=_row_baru("IDU"))
        assert r.status_code == 401
        assert "detail" in r.json()


def test_post_role_viewer_403():
    with TestClient(app) as client:
        r = client.post("/api/raw-data", json=_row_baru("IDU"), headers=auth_header("viewer"))
        assert r.status_code == 403
        assert r.json()["detail"] == "Role viewer hanya bisa membaca data"


def test_viewer_bisa_baca():
    with TestClient(app) as client:
        r = client.get("/api/raw-data", headers=auth_header("viewer"))
        assert r.status_code == 200


def test_token_expired_401():
    with TestClient(app) as client:
        r = client.get("/api/raw-data", headers=auth_header("admin", expired=True))
        assert r.status_code == 401
        assert "detail" in r.json()


def test_token_palsu_401():
    with TestClient(app) as client:
        r = client.get("/api/raw-data", headers=auth_header("admin", fake=True))
        assert r.status_code == 401
        r = client.post("/api/raw-data", json=_row_baru("IDU"), headers=auth_header(fake=True))
        assert r.status_code == 401
        assert "detail" in r.json()


def test_post_upsert_ganti_baris_lama():
    with TestClient(app) as client:
        combo = {**_row_baru("IDU"), "date": "2025-01-01", "model": "Model Z"}
        r1 = client.post("/api/raw-data", json=combo, headers=auth_header())
        assert r1.status_code == 200
        total1 = r1.json()["total_rows"]
        r2 = client.post("/api/raw-data", json={**combo, "input_qty": 999}, headers=auth_header())
        assert r2.status_code == 200
        assert r2.json()["total_rows"] == total1
        rows = client.get("/api/raw-data", headers=auth_header()).json()["rows"]
        matches = [r for r in rows if r["line"] == "IDU" and r["model"] == "Model Z" and r["date"] == "2025-01-01"]
        assert len(matches) == 1
        assert matches[0]["input_qty"] == 999


def test_post_fpg_melebihi_input_ditolak():
    with TestClient(app) as client:
        r = client.post("/api/raw-data", json={**_row_baru("IDU"), "first_pass_good_qty": 200, "defect_qty": 10, "input_qty": 200}, headers=auth_header())
        assert r.status_code == 422


def test_improvement_baseline_nol_tidak_crash():
    from backend.engine import IMPROVEMENTS, kalkulasi_kpi

    IMPROVEMENTS.append({"title": "x", "baseline": 0, "after": 5, "unit": "x"})
    try:
        k = kalkulasi_kpi([{"input_qty": 10, "first_pass_good_qty": 9, "defect_qty": 1, "planned_minutes": 100, "downtime_minutes": 10, "target_ct_sec": 60, "actual_ct_sec": 63, "standard_setup_min": 30, "actual_setup_min": 35}])
        assert "improvement_effectiveness" in k
    finally:
        IMPROVEMENTS.pop()


# ---------------------------------------------------------------------------
# Rate limiting login (anti brute-force).
# ---------------------------------------------------------------------------

def test_login_rate_limit_429():
    from backend.main import login_limiter

    with TestClient(app) as client:
        login_limiter.reset("testclient")
        try:
            kode = [
                client.post("/api/auth/login", json={"username": "admin", "password": "salah"}).status_code
                for _ in range(6)
            ]
            # 4 gagal -> 401, gagal ke-5 -> lockout 429, ke-6 -> 429.
            assert kode.count(401) >= 4
            assert kode[-1] == 429
            assert 429 in kode
            r = client.post("/api/auth/login", json={"username": "admin", "password": "salah"})
            assert r.status_code == 429
            assert "detik" in r.json()["detail"]
        finally:
            login_limiter.reset("testclient")


def test_post_category_valid():
    with TestClient(app) as client:
        r = client.post(
            "/api/raw-data",
            json={**_row_baru("IDU"), "category": "ac split"},
            headers=auth_header(),
        )
        assert r.status_code == 200
        rows = client.get("/api/raw-data", headers=auth_header()).json()["rows"]
        matches = [
            b
            for b in rows
            if b["line"] == "IDU" and b["model"] == "Model A" and b["date"] == "2026-08-11"
        ]
        assert len(matches) == 1
        assert matches[0]["category"] == "AC SPLIT"


def test_post_category_invalid():
    with TestClient(app) as client:
        r = client.post(
            "/api/raw-data",
            json={**_row_baru("IDU"), "category": "XXL"},
            headers=auth_header(),
        )
        assert r.status_code == 422
