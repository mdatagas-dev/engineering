import { describe, expect, it } from "vitest";
import parityRows from "../../backend/tests/fixtures/parity_rows.json";
import { ambilPareto, ambilTren, kalkulasiKpi } from "./kalkulator";
import type { DailyRaw } from "./data";

type SnakeRow = Record<string, string | number>;

const MAP: Record<string, keyof DailyRaw> = {
  date: "date",
  model: "model",
  line: "line",
  input_qty: "inputQty",
  first_pass_good_qty: "firstPassGoodQty",
  defect_qty: "defectQty",
  planned_minutes: "plannedMinutes",
  downtime_minutes: "downtimeMinutes",
  target_ct_sec: "targetCtSec",
  actual_ct_sec: "actualCtSec",
  standard_setup_min: "standardSetupMin",
  actual_setup_min: "actualSetupMin",
};

const fixture: DailyRaw[] = (parityRows as SnakeRow[]).map((r) =>
  Object.fromEntries(
    Object.entries(MAP).map(([snake, camel]) => [camel, r[snake]])
  )
) as unknown as DailyRaw[];

describe("kalkulasiKpi — dataset mini (hitung manual)", () => {
  const mini: DailyRaw[] = [
    {
      date: "2026-08-01", model: "Model A", line: "Line 1", category: "",
      inputQty: 200, firstPassGoodQty: 190, defectQty: 5,
      plannedMinutes: 480, downtimeMinutes: 40,
      targetCtSec: 60, actualCtSec: 64,
      standardSetupMin: 30, actualSetupMin: 33,
    },
    {
      date: "2026-08-01", model: "Model B", line: "Line 2", category: "",
      inputQty: 200, firstPassGoodQty: 192, defectQty: 4,
      plannedMinutes: 480, downtimeMinutes: 60,
      targetCtSec: 60, actualCtSec: 60,
      standardSetupMin: 30, actualSetupMin: 30,
    },
    {
      date: "2026-08-01", model: "Model C", line: "Line 3", category: "",
      inputQty: 150, firstPassGoodQty: 141, defectQty: 6,
      plannedMinutes: 480, downtimeMinutes: 30,
      targetCtSec: 59, actualCtSec: 62,
      standardSetupMin: 29, actualSetupMin: 31,
    },
  ];

  it("fpy = 523/550 = 95.09", () => {
    expect(kalkulasiKpi(mini).fpy).toBeCloseTo(95.09, 1);
  });

  it("oee = availability(90.97) x performance(96.24) x quality(97.27) = 85.16", () => {
    const k = kalkulasiKpi(mini);
    expect(k.availability).toBeCloseTo(90.97, 1);
    expect(k.performance).toBeCloseTo(96.24, 1);
    expect(k.quality).toBeCloseTo(97.27, 1);
    expect(k.oee).toBeCloseTo(85.16, 1);
  });

  it("lineBalance = rata-rata 3 line dari STATION_BALANCE = 92.02", () => {
    expect(kalkulasiKpi(mini).lineBalance).toBeCloseTo(92.02, 1);
  });

  it("setupAchievement = 89/94 = 94.68", () => {
    expect(kalkulasiKpi(mini).setupAchievement).toBeCloseTo(94.68, 1);
  });

  it("issueClosure = 4 dari 10 issue closed = 40", () => {
    expect(kalkulasiKpi(mini).issueClosure).toBe(40);
  });

  it("ambilTren mengelompokkan per tanggal", () => {
    const tren = ambilTren(mini);
    expect(tren).toHaveLength(1);
    expect(tren[0].date).toBe("08-01");
    expect(tren[0].fpy).toBeCloseTo(95.09, 1);
  });
});

describe("kalkulasiKpi — edge cases", () => {
  it("dataset kosong → KPI produksi 0 (mock data dihapus)", () => {
    const k = kalkulasiKpi([]);
    expect(k.fpy).toBe(0);
    expect(k.oee).toBe(0);
    expect(k.lineBalance).toBe(0);
    expect(k.setupAchievement).toBe(0);
    expect(k.cycleTimeAchievement).toBe(0);
    expect(k.taktTimeSec).toBeCloseTo(68.57, 1);
  });

  it("kalkulasiKpi menerima data engineering opsional (kosong → 0)", () => {
    const k = kalkulasiKpi([], { issues: [], tools: [], improvements: [] });
    expect(k.issueClosure).toBe(0);
    expect(k.toolAvailability).toBe(0);
    expect(k.improvementEffectiveness).toBe(0);
  });

  it("defect > input tetap menghasilkan angka terdefinisi (tidak NaN)", () => {
    const k = kalkulasiKpi([
      {
        date: "2026-08-01", model: "Model A", line: "Line 1", category: "",
        inputQty: 100, firstPassGoodQty: 50, defectQty: 150,
        plannedMinutes: 480, downtimeMinutes: 60,
        targetCtSec: 60, actualCtSec: 65,
        standardSetupMin: 30, actualSetupMin: 35,
      },
    ]);
    expect(k.quality).toBeLessThan(0);
    expect(Number.isFinite(k.fpy)).toBe(true);
    expect(Number.isFinite(k.oee)).toBe(true);
  });
});

describe("ambilPareto", () => {
  const rows: DailyRaw[] = [
    { date: "d", model: "Model A", line: "Line 1", category: "", inputQty: 100, firstPassGoodQty: 90, defectQty: 10, plannedMinutes: 480, downtimeMinutes: 0, targetCtSec: 60, actualCtSec: 60, standardSetupMin: 30, actualSetupMin: 30 },
    { date: "d", model: "Model B", line: "Line 2", category: "", inputQty: 100, firstPassGoodQty: 95, defectQty: 5, plannedMinutes: 480, downtimeMinutes: 0, targetCtSec: 60, actualCtSec: 60, standardSetupMin: 30, actualSetupMin: 30 },
    { date: "d", model: "Model C", line: "Line 3", category: "", inputQty: 100, firstPassGoodQty: 97, defectQty: 3, plannedMinutes: 480, downtimeMinutes: 0, targetCtSec: 60, actualCtSec: 60, standardSetupMin: 30, actualSetupMin: 30 },
  ];

  it("urut menurun berdasarkan defects", () => {
    const p = ambilPareto(rows);
    expect(p.map((e) => e.model)).toEqual(["Model A", "Model B", "Model C"]);
    expect(p.map((e) => e.defects)).toEqual([10, 5, 3]);
  });

  it("kumulatif berakhir di 100%", () => {
    const p = ambilPareto(rows);
    expect(p[0].cumulativePct).toBeCloseTo((10 / 18) * 100, 1);
    expect(p[2].cumulativePct).toBeCloseTo(100, 1);
  });
});

describe("parity TS <-> Python (fixture bersama)", () => {
  it("kalkulasiKpi(fixture) sama dengan golden parity", () => {
    const k = kalkulasiKpi(fixture);
    expect(k.fpy).toBeCloseTo(95.56, 1);
    expect(k.oee).toBeCloseTo(88.43, 1);
    expect(k.lineBalance).toBeCloseTo(92.02, 1);
    expect(k.setupAchievement).toBeCloseTo(92.6, 1);
    expect(k.issueClosure).toBeCloseTo(40.0, 1);
  });
});