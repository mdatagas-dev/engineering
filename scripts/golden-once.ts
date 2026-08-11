import fs from "node:fs";
import { kalkulasiKpi } from "../src/lib/kalkulator";
import type { DailyRaw } from "../src/lib/data";

type SnakeRow = Record<string, string | number>;
const rows = JSON.parse(
  fs.readFileSync(new URL("../backend/tests/fixtures/parity_rows.json", import.meta.url), "utf8")
) as SnakeRow[];

const map: Record<string, keyof DailyRaw> = {
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

const fixture: DailyRaw[] = rows.map((r) =>
  Object.fromEntries(Object.entries(map).map(([snake, camel]) => [camel, r[snake]]))
) as DailyRaw[];

const k = kalkulasiKpi(fixture);
console.log(JSON.stringify(k, null, 2));