"""Calculation Engine — seluruh rumus KPI standar internasional per PRD."""
from __future__ import annotations

import random
from datetime import date, timedelta
from typing import Any


LINES = ["IDU", "ODU", "LINE 1"]
MODELS = ["AC SPLIT 1 PK", "AC SPLIT 1.5 PK", "AC SPLIT 2 PK"]
DEMAND_PER_DAY = 420
PLANNED_MINUTES = 480
DAYS = 30

SEED_CATEGORY = "AC SPLIT"


def _seed() -> list[dict[str, Any]]:
    rnd = random.Random(20260811)
    rows: list[dict[str, Any]] = []
    today = date.today()
    for i in range(DAYS - 1, -1, -1):
        d = today - timedelta(days=i)
        for line in LINES:
            for model in MODELS:
                input_qty = 180 + rnd.randint(0, 90)
                defect_qty = rnd.randint(0, 8)
                first_pass_good = input_qty - defect_qty - rnd.randint(0, 4)
                target_ct = 55 + rnd.randint(0, 10)
                standard_setup = 28 + rnd.randint(0, 8)
                rows.append(
                    {
                        "date": d.isoformat(),
                        "model": model,
                        "line": line,
                        "category": SEED_CATEGORY,
                        "input_qty": input_qty,
                        "first_pass_good_qty": first_pass_good,
                        "defect_qty": defect_qty,
                        "planned_minutes": 420 + rnd.randint(0, 30),
                        "downtime_minutes": 15 + rnd.randint(0, 55),
                        "target_ct_sec": target_ct,
                        "actual_ct_sec": target_ct + rnd.randint(-3, 8),
                        "standard_setup_min": standard_setup,
                        "actual_setup_min": standard_setup + rnd.randint(-6, 20),
                    }
                )
    return rows


RAW: list[dict[str, Any]] = _seed()


def reset_raw() -> int:
    """Kembalikan RAW ke kondisi seed awal (mutasi in-place agar referensi tetap sama)."""
    RAW.clear()
    RAW.extend(_seed())
    return len(RAW)


def sync_issues(rows: list[dict[str, Any]]) -> None:
    """Ganti isi ISSUES dengan baris dari DB (mutasi in-place, referensi tetap).

    Baris DB punya key ekstra (id, eng_id) selain yang dipakai KPI
    (status, due_date) — tidak mengganggu kalkulasi_kpi.
    """
    ISSUES[:] = rows


def sync_tools(rows: list[dict[str, Any]]) -> None:
    TOOLS[:] = rows


def sync_improvements(rows: list[dict[str, Any]]) -> None:
    IMPROVEMENTS[:] = rows

STATION_BALANCE: list[dict[str, Any]] = [
    {"line": l, "station": s, "work_content_sec": w, "cycle_time_sec": c}
    for l, data in {
        "Line 1": [("St 1 Loading", 66, 69), ("St 2 Assembly", 67, 70), ("St 3 Insertion", 68, 71),
                   ("St 4 Welding", 68, 72), ("St 5 Testing", 66, 69), ("St 6 Packing", 65, 68)],
        "Line 2": [("St 1 Loading", 67, 70), ("St 2 Assembly", 68, 71), ("St 3 Insertion", 69, 73),
                   ("St 4 Welding", 70, 74), ("St 5 Testing", 66, 70), ("St 6 Packing", 65, 69)],
        "Line 3": [("St 1 Loading", 65, 68), ("St 2 Assembly", 66, 69), ("St 3 Insertion", 67, 70),
                   ("St 4 Welding", 67, 71), ("St 5 Testing", 64, 68), ("St 6 Packing", 64, 67)],
    }.items()
    for s, w, c in data
]

ISSUES: list[dict[str, Any]] = [
    {"id": "ENG-1042", "title": "Air pressure drop pada welding gun Line 1", "line": "Line 1", "owner": "Andi",
     "priority": "high", "status": "open", "due_date": "2026-08-09"},
    {"id": "ENG-1041", "title": "Sensor proximity St 4 sering false trigger", "line": "Line 2", "owner": "Budi",
     "priority": "high", "status": "open", "due_date": "2026-08-13"},
    {"id": "ENG-1039", "title": "Kalibrasi torque tool St 3 melebihi jadwal", "line": "Line 3", "owner": "Citra",
     "priority": "medium", "status": "progress", "due_date": "2026-08-18"},
    {"id": "ENG-1036", "title": "Conveyor belt aus di stasiun packing", "line": "Line 1", "owner": "Dedi",
     "priority": "medium", "status": "progress", "due_date": "2026-08-21"},
    {"id": "ENG-1031", "title": "Program PLC changeover Model C perlu update", "line": "Line 2", "owner": "Eka",
     "priority": "medium", "status": "progress", "due_date": "2026-08-25"},
    {"id": "ENG-1028", "title": "Vibration abnormal motor test bench", "line": "Line 3", "owner": "Fajar",
     "priority": "low", "status": "progress", "due_date": "2026-08-30"},
    {"id": "ENG-1022", "title": "Jig fixture Model A longgar di St 2", "line": "Line 1", "owner": "Andi",
     "priority": "medium", "status": "closed", "due_date": "2026-08-05"},
    {"id": "ENG-1017", "title": "Replacing seal pneumatic cylinder", "line": "Line 2", "owner": "Budi",
     "priority": "low", "status": "closed", "due_date": "2026-08-02"},
    {"id": "ENG-1009", "title": "Optimasi parameter soldering", "line": "Line 3", "owner": "Citra",
     "priority": "medium", "status": "closed", "due_date": "2026-07-28"},
    {"id": "ENG-0998", "title": "Ganti bearing motor roller Line 1", "line": "Line 1", "owner": "Dedi",
     "priority": "high", "status": "closed", "due_date": "2026-07-22"},
]

TOOLS: list[dict[str, Any]] = [
    {"name": "Torque Wrench DST", "planned_hours": 120, "actual_available_hours": 114},
    {"name": "Welding Gun Inverter", "planned_hours": 140, "actual_available_hours": 128},
    {"name": "Calibrator Digital", "planned_hours": 90, "actual_available_hours": 88},
    {"name": "Torque Driver ASG", "planned_hours": 110, "actual_available_hours": 96},
    {"name": "Pneumatic Press", "planned_hours": 100, "actual_available_hours": 92},
    {"name": "Thermal Camera FLIR", "planned_hours": 60, "actual_available_hours": 60},
]

IMPROVEMENTS: list[dict[str, Any]] = [
    {"title": "Perbaikan jig welding Model A", "baseline": 1.8, "after": 0.6, "unit": "defect/hr"},
    {"title": "Standardisasi torque setting", "baseline": 3.2, "after": 1.4, "unit": "defect/hr"},
    {"title": "Reduksi setup changeover Line 2", "baseline": 46, "after": 32, "unit": "min"},
    {"title": "Otomasi inspeksi visual", "baseline": 12, "after": 7, "unit": "min/unit"},
    {"title": "Pemeliharaan preventif roller", "baseline": 9.5, "after": 4.2, "unit": "downtime hr/bln"},
]


def _avg(nums: list[float]) -> float:
    return sum(nums) / max(1, len(nums))


def kalkulasi_kpi(rows: list[dict[str, Any]]) -> dict[str, Any]:
    """Hitung seluruh KPI dari raw data. Urutan: Demand → Takt → Output → Setup → OEE → Quality."""
    total = {"input": 0, "first_pass": 0, "defect": 0, "planned": 0, "downtime": 0,
             "std_setup": 0, "act_setup": 0}
    for r in rows:
        total["input"] += r["input_qty"]
        total["first_pass"] += r["first_pass_good_qty"]
        total["defect"] += r["defect_qty"]
        total["planned"] += r["planned_minutes"]
        total["downtime"] += r["downtime_minutes"]
        total["std_setup"] += r["standard_setup_min"]
        total["act_setup"] += r["actual_setup_min"]

    fpy = total["first_pass"] / total["input"] * 100 if total["input"] else 0
    quality = (total["input"] - total["defect"]) / total["input"] if total["input"] else 0
    availability = (total["planned"] - total["downtime"]) / total["planned"] if total["planned"] else 0

    takt_time = PLANNED_MINUTES * 60 / DEMAND_PER_DAY
    target_qty = total["planned"] * 60 / takt_time if takt_time else 0
    output_achievement = total["input"] / target_qty * 100 if target_qty else 0
    efficiency_deviation = (total["input"] - target_qty) / target_qty * 100 if target_qty else 0
    performance = total["input"] / target_qty if target_qty else 0
    oee = availability * performance * quality * 100

    std_setup = total["std_setup"] / total["input"] if total["input"] else 0
    act_setup = total["act_setup"] / total["input"] if total["input"] else 0
    setup_achievement = std_setup / act_setup * 100 if act_setup else 0
    setup_variance = act_setup - std_setup

    today = date.today().isoformat()
    total_issues = len(ISSUES)
    closed = sum(1 for i in ISSUES if i["status"] == "closed")
    overdue = sum(1 for i in ISSUES if i["status"] != "closed" and i["due_date"] < today)
    issue_closure = closed / total_issues * 100 if total_issues else 0
    overdue_rate = overdue / total_issues * 100 if total_issues else 0

    planned_tool = sum(t["planned_hours"] for t in TOOLS)
    actual_tool = sum(t["actual_available_hours"] for t in TOOLS)
    tool_availability = actual_tool / planned_tool * 100 if planned_tool else 0

    improvement_effectiveness = _avg([
        (i["baseline"] - i["after"]) / i["baseline"] * 100
        for i in IMPROVEMENTS if i["baseline"] > 0
    ])

    takt_time = PLANNED_MINUTES * 60 / DEMAND_PER_DAY

    return {
        "fpy": round(fpy, 2),
        "defect_rate": round(total["defect"] / total["input"] * 100, 2) if total["input"] else 0,
        "oee": round(oee, 2),
        "availability": round(availability * 100, 2),
        "performance": round(performance * 100, 2),
        "quality": round(quality * 100, 2),
        "output_achievement": round(output_achievement, 2),
        "efficiency_deviation": round(efficiency_deviation, 2),
        "takt_time_sec": round(takt_time, 1),
        "setup_achievement": round(setup_achievement, 2),
        "setup_variance_min": round(setup_variance, 2),
        "avg_actual_setup_min": round(act_setup, 2),
        "issue_closure": round(issue_closure, 2),
        "overdue_rate": round(overdue_rate, 2),
        "tool_availability": round(tool_availability, 2),
        "improvement_effectiveness": round(improvement_effectiveness, 2),
    }


def ambil_tren() -> list[dict[str, Any]]:
    grouped: dict[str, list[dict[str, Any]]] = {}
    for r in RAW:
        grouped.setdefault(r["date"], []).append(r)
    points = []
    for day in sorted(grouped):
        k = kalkulasi_kpi(grouped[day])
        points.append({
            "date": day[5:],
            "fpy": k["fpy"],
            "oee": k["oee"],
            "output_achievement": k["output_achievement"],
            "setup_achievement": k["setup_achievement"],
            "issue_closure": k["issue_closure"],
        })
    return points


def ambil_pareto() -> list[dict[str, Any]]:
    by_model: dict[str, int] = {}
    for r in RAW:
        by_model[r["model"]] = by_model.get(r["model"], 0) + r["defect_qty"]
    total = sum(by_model.values())
    cum = 0
    result = []
    for model, defects in sorted(by_model.items(), key=lambda kv: kv[1], reverse=True):
        cum += defects
        result.append({
            "model": model,
            "defects": defects,
            "cumulative_pct": round(cum / total * 100, 2) if total else 0,
        })
    return result


def ambil_defect_per_line() -> list[dict[str, Any]]:
    by_line: dict[str, int] = {}
    for r in RAW:
        by_line[r["line"]] = by_line.get(r["line"], 0) + r["defect_qty"]
    return [{"line": line, "defects": defects} for line, defects in by_line.items()]


def setup_per_day() -> dict[str, Any]:
    grouped: dict[str, dict[str, list[float]]] = {}
    for r in RAW:
        e = grouped.setdefault(r["date"][5:], {"std": [], "act": []})
        e["std"].append(r["standard_setup_min"])
        e["act"].append(r["actual_setup_min"])
    dates, std, act = [], [], []
    for day in sorted(grouped):
        dates.append(day)
        std.append(round(_avg(grouped[day]["std"]), 1))
        act.append(round(_avg(grouped[day]["act"]), 1))
    return {"dates": dates, "std": std, "act": act}


def cycle_achievement_per_day() -> list[float]:
    grouped: dict[str, dict[str, list[float]]] = {}
    for r in RAW:
        e = grouped.setdefault(r["date"][5:], {"target": [], "actual": []})
        e["target"].append(r["target_ct_sec"])
        e["actual"].append(r["actual_ct_sec"])
    result = []
    for day in sorted(grouped):
        e = grouped[day]
        result.append(round(_avg(e["target"]) / _avg(e["actual"]) * 100, 1))
    return result


def fpy_defect_daily() -> dict[str, Any]:
    grouped: dict[str, dict[str, list[float]]] = {}
    for r in RAW:
        e = grouped.setdefault(r["date"][5:], {"good": [], "defect": []})
        e["good"].append(r["first_pass_good_qty"])
        e["defect"].append(r["defect_qty"])
    dates, fpy, dr = [], [], []
    for day in sorted(grouped):
        e = grouped[day]
        good, defect = sum(e["good"]), sum(e["defect"])
        total = good + defect
        dates.append(day)
        fpy.append(round(good / total * 100, 2) if total else 0)
        dr.append(round(defect / total * 100, 2) if total else 0)
    return {"dates": dates, "fpy": fpy, "defect_rate": dr}
