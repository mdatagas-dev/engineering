import {
  STATION_BALANCE,
  ISSUES,
  TOOLS,
  IMPROVEMENTS,
  type DailyRaw,
  type StationBalance,
} from "./data";

export interface KpiSnapshot {
  fpy: number;
  defectRate: number;
  oee: number;
  availability: number;
  performance: number;
  quality: number;
  cycleTimeAchievement: number;
  taktTimeSec: number;
  lineBalance: number;
  bottleneckStation: string;
  setupAchievement: number;
  setupVarianceMin: number;
  avgActualSetupMin: number;
  issueClosure: number;
  overdueRate: number;
  toolAvailability: number;
  improvementEffectiveness: number;
}

export interface TrendPoint {
  date: string;
  fpy: number;
  oee: number;
  lineBalance: number;
  setupAchievement: number;
  issueClosure: number;
}

export interface ParetoEntry {
  model: string;
  defects: number;
  cumulativePct: number;
}

export interface DefectPerLine {
  line: string;
  defects: number;
}

function avg(nums: number[]) {
  return nums.reduce((a, b) => a + b, 0) / Math.max(1, nums.length);
}

const DEMAND_PER_DAY = 420;
const PLANNED_MINUTES = 480;

export function kalkulasiKpi(
  rows: DailyRaw[],
  eng?: { issues: { status: string; dueDate: string }[]; tools: { plannedHours: number; actualAvailableHours: number }[]; improvements: { baseline: number; after: number }[] }
): KpiSnapshot {
  const totals = rows.reduce(
    (acc, r) => {
      acc.input += r.inputQty;
      acc.firstPass += r.firstPassGoodQty;
      acc.defect += r.defectQty;
      acc.planned += r.plannedMinutes;
      acc.downtime += r.downtimeMinutes;
      acc.targetCt += r.targetCtSec;
      acc.actualCt += r.actualCtSec;
      acc.stdSetup += r.standardSetupMin;
      acc.actSetup += r.actualSetupMin;
      return acc;
    },
    { input: 0, firstPass: 0, defect: 0, planned: 0, downtime: 0, targetCt: 0, actualCt: 0, stdSetup: 0, actSetup: 0 }
  );

  const fpy = totals.input ? (totals.firstPass / totals.input) * 100 : 0;
  const quality = totals.input ? (totals.input - totals.defect) / totals.input : 0;
  const availability = totals.planned ? (totals.planned - totals.downtime) / totals.planned : 0;
  const targetCtAvg = totals.targetCt / totals.input || 0;
  const actualCtAvg = totals.actualCt / totals.input || 0;
  const performance = actualCtAvg ? targetCtAvg / actualCtAvg : 0;
  const oee = availability * performance * quality * 100;

  const byLine = new Map<string, StationBalance[]>();
  for (const s of STATION_BALANCE) {
    const list = byLine.get(s.line) ?? [];
    list.push(s);
    byLine.set(s.line, list);
  }
  let balanceSum = 0;
  let lineCount = 0;
  let bottleneck: StationBalance | null = null;
  for (const stations of byLine.values()) {
    const bt = stations.reduce((a, b) => (a.cycleTimeSec > b.cycleTimeSec ? a : b));
    const totalWork = stations.reduce((a, s) => a + s.workContentSec, 0);
    balanceSum += (totalWork / (bt.cycleTimeSec * stations.length)) * 100;
    lineCount++;
    if (!bottleneck || bt.cycleTimeSec > bottleneck.cycleTimeSec) bottleneck = bt;
  }
  const lineBalance = rows.length && bottleneck ? balanceSum / lineCount : 0;

  const stdSetup = totals.stdSetup / totals.input || 0;
  const actSetup = totals.actSetup / totals.input || 0;
  const setupAchievement = actSetup ? (stdSetup / actSetup) * 100 : 0;
  const setupVariance = actSetup - stdSetup;

  const issues = eng?.issues ?? ISSUES;
  const tools = eng?.tools ?? TOOLS;
  const improvements = eng?.improvements ?? IMPROVEMENTS;

  const totalIssues = issues.length;
  const closed = issues.filter((i) => i.status === "closed").length;
  const overdue = issues.filter((i) => i.status !== "closed" && i.dueDate < new Date().toISOString().slice(0, 10)).length;
  const issueClosure = totalIssues ? (closed / totalIssues) * 100 : 0;
  const overdueRate = totalIssues ? (overdue / totalIssues) * 100 : 0;

  const plannedTool = tools.reduce((a, t) => a + t.plannedHours, 0);
  const toolAvailability = plannedTool
    ? (tools.reduce((a, t) => a + t.actualAvailableHours, 0) / plannedTool) * 100
    : 0;

  const improvementEffectiveness = improvements.length
    ? avg(improvements.map((i) => ((i.baseline - i.after) / i.baseline) * 100))
    : 0;

  const taktTimeSec = (PLANNED_MINUTES * 60) / DEMAND_PER_DAY;
  const cycleTimeAchievement = actualCtAvg ? (targetCtAvg / actualCtAvg) * 100 : 0;

  return {
    fpy,
    defectRate: (totals.defect / totals.input) * 100,
    oee,
    availability: availability * 100,
    performance: performance * 100,
    quality: quality * 100,
    cycleTimeAchievement,
    taktTimeSec,
    lineBalance,
    bottleneckStation: bottleneck ? `${bottleneck.line} · ${bottleneck.station}` : "-",
    setupAchievement,
    setupVarianceMin: setupVariance,
    avgActualSetupMin: actSetup,
    issueClosure,
    overdueRate,
    toolAvailability,
    improvementEffectiveness,
  };
}

export function ambilTren(all: DailyRaw[]): TrendPoint[] {
  const grouped = new Map<string, DailyRaw[]>();
  for (const r of all) {
    const list = grouped.get(r.date) ?? [];
    list.push(r);
    grouped.set(r.date, list);
  }
  const points: TrendPoint[] = [];
  for (const [date, rows] of grouped) {
    const k = kalkulasiKpi(rows);
    points.push({
      date: date.slice(5),
      fpy: k.fpy,
      oee: k.oee,
      lineBalance: k.lineBalance,
      setupAchievement: k.setupAchievement,
      issueClosure: k.issueClosure,
    });
  }
  return points;
}

export function ambilPareto(all: DailyRaw[]): ParetoEntry[] {
  const byModel = new Map<string, number>();
  for (const r of all) {
    byModel.set(r.model, (byModel.get(r.model) ?? 0) + r.defectQty);
  }
  const total = [...byModel.values()].reduce((a, b) => a + b, 0);
  let cum = 0;
  return [...byModel.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([model, defects]) => {
      cum += defects;
      return { model, defects, cumulativePct: (cum / total) * 100 };
    });
}

export function ambilDefectPerLine(all: DailyRaw[]): DefectPerLine[] {
  const byLine = new Map<string, number>();
  for (const r of all) {
    byLine.set(r.line, (byLine.get(r.line) ?? 0) + r.defectQty);
  }
  return [...byLine.entries()].map(([line, defects]) => ({ line, defects }));
}
