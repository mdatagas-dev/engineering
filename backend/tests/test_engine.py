"""Sanity test calculation engine — tidak butuh DB."""
import json
from pathlib import Path

import pytest

from backend.engine import ISSUES, RAW, kalkulasi_kpi, sync_issues

KPI_KUNCI = ["fpy", "oee", "output_achievement", "setup_achievement", "issue_closure"]

FIXTURE = Path(__file__).parent / "fixtures" / "parity_rows.json"

# Snapshot ISSUES saat collection (sebelum test apa pun berjalan) — test_api
# bisa mengubah global ISSUES via sync_issues, sehingga issue_closure tidak
# deterministik kalau dihitung dari state sisa.
PRISTINE_ISSUES = [dict(i) for i in ISSUES]


def test_kalkulasi_kpi_berisi_kunci_dan_range_0_100():
    k = kalkulasi_kpi(RAW)
    for kunci in KPI_KUNCI:
        assert kunci in k
        assert isinstance(k[kunci], (int, float))
        assert 0 <= k[kunci] <= 100
    assert "efficiency_deviation" in k
    assert isinstance(k["efficiency_deviation"], (int, float))


def test_kalkulasi_parity_fixture():
    """Golden values dari fixture parity bersama (backend/tests/fixtures/parity_rows.json).

    Nilai ini harus identik dengan hasil TS `kalkulasiKpi` pada fixture yang sama
    (lihat src/lib/kalkulator.test.ts) dalam toleransi 0.01.
    """
    sync_issues(PRISTINE_ISSUES)
    rows = json.loads(FIXTURE.read_text())
    assert len(rows) == 12
    k = kalkulasi_kpi(rows)
    golden = {
        "fpy": 95.56,
        "oee": 46.38,
        "output_achievement": 51.31,
        "efficiency_deviation": -48.69,
        "setup_achievement": 92.6,
        "issue_closure": 40.0,
    }
    for kunci, nilai in golden.items():
        assert k[kunci] == pytest.approx(nilai, abs=0.01), f"{kunci}: {k[kunci]} != {nilai}"
