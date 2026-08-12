export interface DailyRaw {
  date: string;
  model: string;
  line: string;
  category: string;
  inputQty: number;
  firstPassGoodQty: number;
  defectQty: number;
  plannedMinutes: number;
  downtimeMinutes: number;
  targetCtSec: number;
  actualCtSec: number;
  standardSetupMin: number;
  actualSetupMin: number;
}

export interface StationBalance {
  line: string;
  station: string;
  workContentSec: number;
  cycleTimeSec: number;
}

export interface EngineeringIssue {
  id: string;
  title: string;
  line: string;
  owner: string;
  priority: "high" | "medium" | "low";
  status: "open" | "progress" | "closed";
  dueDate: string;
}

export interface ToolRecord {
  name: string;
  plannedHours: number;
  actualAvailableHours: number;
}

export interface ImprovementRecord {
  title: string;
  baseline: number;
  after: number;
  unit: string;
}

const LINES = ["IDU", "ODU"];
const MODELS = ["AC SPLIT 1 PK", "AC SPLIT 1.5 PK", "AC SPLIT 2 PK"];
const SEED_CATEGORY = "AC SPLIT";

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DAYS = 30;
const today = new Date();
function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

export const DAILY_RAW: DailyRaw[] = (() => {
  const rnd = mulberry32(20260811);
  const rows: DailyRaw[] = [];
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const date = iso(d);
    for (const line of LINES) {
      for (const model of MODELS) {
        const inputQty = 180 + Math.floor(rnd() * 90);
        const defectQty = Math.floor(rnd() * 8);
        const firstPassGoodQty = inputQty - defectQty - Math.floor(rnd() * 4);
        const plannedMinutes = 420 + Math.floor(rnd() * 30);
        const downtimeMinutes = 15 + Math.floor(rnd() * 55);
        const targetCtSec = 55 + Math.floor(rnd() * 10);
        const actualCtSec = targetCtSec + Math.floor(rnd() * 8) - 3;
        const standardSetupMin = 28 + Math.floor(rnd() * 8);
        const actualSetupMin = standardSetupMin + Math.floor(rnd() * 20) - 6;
        rows.push({
          date,
          model,
          line,
          category: SEED_CATEGORY,
          inputQty,
          firstPassGoodQty,
          defectQty,
          plannedMinutes,
          downtimeMinutes,
          targetCtSec,
          actualCtSec,
          standardSetupMin,
          actualSetupMin,
        });
      }
    }
  }
  return rows;
})();

export const STATION_BALANCE: StationBalance[] = [
  { line: "Line 1", station: "St 1 Loading", workContentSec: 66, cycleTimeSec: 69 },
  { line: "Line 1", station: "St 2 Assembly", workContentSec: 67, cycleTimeSec: 70 },
  { line: "Line 1", station: "St 3 Insertion", workContentSec: 68, cycleTimeSec: 71 },
  { line: "Line 1", station: "St 4 Welding", workContentSec: 68, cycleTimeSec: 72 },
  { line: "Line 1", station: "St 5 Testing", workContentSec: 66, cycleTimeSec: 69 },
  { line: "Line 1", station: "St 6 Packing", workContentSec: 65, cycleTimeSec: 68 },
  { line: "Line 2", station: "St 1 Loading", workContentSec: 67, cycleTimeSec: 70 },
  { line: "Line 2", station: "St 2 Assembly", workContentSec: 68, cycleTimeSec: 71 },
  { line: "Line 2", station: "St 3 Insertion", workContentSec: 69, cycleTimeSec: 73 },
  { line: "Line 2", station: "St 4 Welding", workContentSec: 70, cycleTimeSec: 74 },
  { line: "Line 2", station: "St 5 Testing", workContentSec: 66, cycleTimeSec: 70 },
  { line: "Line 2", station: "St 6 Packing", workContentSec: 65, cycleTimeSec: 69 },
  { line: "Line 3", station: "St 1 Loading", workContentSec: 65, cycleTimeSec: 68 },
  { line: "Line 3", station: "St 2 Assembly", workContentSec: 66, cycleTimeSec: 69 },
  { line: "Line 3", station: "St 3 Insertion", workContentSec: 67, cycleTimeSec: 70 },
  { line: "Line 3", station: "St 4 Welding", workContentSec: 67, cycleTimeSec: 71 },
  { line: "Line 3", station: "St 5 Testing", workContentSec: 64, cycleTimeSec: 68 },
  { line: "Line 3", station: "St 6 Packing", workContentSec: 64, cycleTimeSec: 67 },
];

export const ISSUES: EngineeringIssue[] = [
  { id: "ENG-1042", title: "Air pressure drop pada welding gun Line 1", line: "Line 1", owner: "Andi", priority: "high", status: "open", dueDate: "2026-08-09" },
  { id: "ENG-1041", title: "Sensor proximity St 4 sering false trigger", line: "Line 2", owner: "Budi", priority: "high", status: "open", dueDate: "2026-08-13" },
  { id: "ENG-1039", title: "Kalibrasi torque tool St 3 melebihi jadwal", line: "Line 3", owner: "Citra", priority: "medium", status: "progress", dueDate: "2026-08-18" },
  { id: "ENG-1036", title: "Conveyor belt aus di stasiun packing", line: "Line 1", owner: "Dedi", priority: "medium", status: "progress", dueDate: "2026-08-21" },
  { id: "ENG-1031", title: "Program PLC changeover Model C perlu update", line: "Line 2", owner: "Eka", priority: "medium", status: "progress", dueDate: "2026-08-25" },
  { id: "ENG-1028", title: "Vibration abnormal motor test bench", line: "Line 3", owner: "Fajar", priority: "low", status: "progress", dueDate: "2026-08-30" },
  { id: "ENG-1022", title: "Jig fixture Model A longgar di St 2", line: "Line 1", owner: "Andi", priority: "medium", status: "closed", dueDate: "2026-08-05" },
  { id: "ENG-1017", title: "Replacing seal pneumatic cylinder", line: "Line 2", owner: "Budi", priority: "low", status: "closed", dueDate: "2026-08-02" },
  { id: "ENG-1009", title: "Optimasi parameter soldering", line: "Line 3", owner: "Citra", priority: "medium", status: "closed", dueDate: "2026-07-28" },
  { id: "ENG-0998", title: "Ganti bearing motor roller Line 1", line: "Line 1", owner: "Dedi", priority: "high", status: "closed", dueDate: "2026-07-22" },
];

export const TOOLS: ToolRecord[] = [
  { name: "Torque Wrench DST", plannedHours: 120, actualAvailableHours: 114 },
  { name: "Welding Gun Inverter", plannedHours: 140, actualAvailableHours: 128 },
  { name: "Calibrator Digital", plannedHours: 90, actualAvailableHours: 88 },
  { name: "Torque Driver ASG", plannedHours: 110, actualAvailableHours: 96 },
  { name: "Pneumatic Press", plannedHours: 100, actualAvailableHours: 92 },
  { name: "Thermal Camera FLIR", plannedHours: 60, actualAvailableHours: 60 },
];

export const IMPROVEMENTS: ImprovementRecord[] = [
  { title: "Perbaikan jig welding Model A", baseline: 1.8, after: 0.6, unit: "defect/hr" },
  { title: "Standardisasi torque setting", baseline: 3.2, after: 1.4, unit: "defect/hr" },
  { title: "Reduksi setup changeover Line 2", baseline: 46, after: 32, unit: "min" },
  { title: "Otomasi inspeksi visual", baseline: 12, after: 7, unit: "min/unit" },
  { title: "Pemeliharaan preventif roller", baseline: 9.5, after: 4.2, unit: "downtime hr/bln" },
];
