"use client";

import { useMemo } from "react";
import { Gauge, Timer, Scale, Layers, Clock } from "lucide-react";
import { Chart } from "@/components/chart";
import { TiltPanel } from "@/components/tilt-panel";
import { PanelHeader } from "@/components/panel-header";
import { STATION_BALANCE } from "@/lib/data";
import { kalkulasiKpi, ambilTren } from "@/lib/kalkulator";
import { useRawRows } from "@/lib/store";
import { formatSec } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";

const AXIS = {
  axisLine: { lineStyle: { color: "rgba(0,214,201,0.15)" } },
  axisLabel: { color: "rgba(147,245,238,0.55)", fontSize: 10 },
  splitLine: { lineStyle: { color: "rgba(0,214,201,0.06)" } },
};
const TOOLTIP = {
  backgroundColor: "rgba(3,9,13,0.95)",
  borderColor: "rgba(0,214,201,0.35)",
  textStyle: { color: "#d3faf6" },
};

export default function ProcessPage() {
  const { t } = useI18n();
  const rows = useRawRows();
  const kpi = useMemo(() => kalkulasiKpi(rows), [rows]);
  const tren = useMemo(() => ambilTren(rows), [rows]);

  const oeeBreakdown = {
    tooltip: { ...TOOLTIP },
    series: [
      {
        type: "pie",
        radius: ["48%", "75%"],
        center: ["50%", "50%"],
        itemStyle: { borderRadius: 10, borderColor: "#03090d", borderWidth: 4 },
        label: { color: "#d3faf6", fontSize: 11, formatter: "{b}\n{c}%" },
        data: [
          { name: t("process.pie.availability"), value: +kpi.availability.toFixed(1), itemStyle: { color: "#00d6c9" } },
          { name: t("process.pie.performance"), value: +kpi.performance.toFixed(1), itemStyle: { color: "#93f5ee" } },
          { name: t("process.pie.quality"), value: +kpi.quality.toFixed(1), itemStyle: { color: "#f59e0b" } },
        ],
      },
    ],
  };

  const line1 = STATION_BALANCE.filter((s) => s.line === "Line 1");
  const bottleneck = line1.reduce((a, b) => (a.cycleTimeSec > b.cycleTimeSec ? a : b));
  const lineBalance = {
    tooltip: { ...TOOLTIP, trigger: "axis" },
    legend: {
      textStyle: { color: "rgba(147,245,238,0.7)", fontSize: 11 },
      top: 0,
      icon: "roundRect",
      itemWidth: 14,
      itemHeight: 6,
    },
    grid: { top: 32, left: 44, right: 16, bottom: 30 },
    xAxis: { type: "category", data: line1.map((s) => s.station.replace("Line 1 · ", "")), ...AXIS },
    yAxis: { type: "value", ...AXIS, axisLabel: { ...AXIS.axisLabel, formatter: `{value} ${t("common.unit.sec")}` } },
    series: [
      {
        name: t("process.series.workContent"),
        type: "bar",
        data: line1.map((s) => s.workContentSec),
        barWidth: 26,
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: "rgba(0,214,201,0.55)",
        },
      },
      {
        name: t("process.series.cycleTime"),
        type: "bar",
        data: line1.map((s) => s.cycleTimeSec),
        barWidth: 26,
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: {
            type: "linear",
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "#00d6c9" },
              { offset: 1, color: "#0a5b63" },
            ],
          },
        },
        markLine: {
          symbol: "none",
          lineStyle: { color: "#f59e0b", type: "dashed", width: 1.5 },
          data: [{ yAxis: bottleneck.cycleTimeSec, label: { color: "#e9d5a0", formatter: t("process.series.bottleneck", { sec: bottleneck.cycleTimeSec }) } }],
        },
      },
    ],
  };

  const cycleTren = tren.map((t) => t.date);
  const cycleAchievementData = useMemo(() => {
    const map = new Map<string, { target: number[]; actual: number[] }>();
    for (const r of rows) {
      const e = map.get(r.date.slice(5)) ?? { target: [], actual: [] };
      e.target.push(r.targetCtSec);
      e.actual.push(r.actualCtSec);
      map.set(r.date.slice(5), e);
    }
    const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
    return [...map.values()].map((e) => +((avg(e.target) / avg(e.actual)) * 100).toFixed(1));
  }, [rows]);

  const cycleAchievement = {
    tooltip: { ...TOOLTIP, trigger: "axis" },
    grid: { top: 28, left: 44, right: 16, bottom: 28 },
    xAxis: { type: "category", data: cycleTren, ...AXIS },
    yAxis: { ...AXIS, min: 80, max: 110, axisLabel: { ...AXIS.axisLabel, formatter: "{value}%" } },
    series: [
      {
        name: t("process.kpi.cycleAchievement"),
        type: "line",
        smooth: true,
        symbol: "none",
        data: cycleAchievementData,
        lineStyle: { width: 3, color: "#93f5ee" },
        areaStyle: {
          color: {
            type: "linear", x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(147,245,238,0.3)" },
              { offset: 1, color: "rgba(147,245,238,0)" },
            ],
          },
        },
        markLine: {
          symbol: "none",
          lineStyle: { color: "#f59e0b", type: "dashed" },
          data: [{ yAxis: 100, label: { color: "#e9d5a0", formatter: t("process.series.target100") } }],
        },
      },
    ],
  };

  const setupPerDay = useMemo(() => {
    const map = new Map<string, { std: number[]; act: number[] }>();
    for (const r of rows) {
      const e = map.get(r.date.slice(5)) ?? { std: [], act: [] };
      e.std.push(r.standardSetupMin);
      e.act.push(r.actualSetupMin);
      map.set(r.date.slice(5), e);
    }
    const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
    return { dates: [...map.keys()], std: [...map.values()].map((e) => +avg(e.std).toFixed(1)), act: [...map.values()].map((e) => +avg(e.act).toFixed(1)) };
  }, [rows]);

  const setupTren = {
    tooltip: { ...TOOLTIP, trigger: "axis" },
    legend: {
      textStyle: { color: "rgba(147,245,238,0.7)", fontSize: 11 },
      top: 0,
      icon: "roundRect",
      itemWidth: 14,
      itemHeight: 6,
    },
    grid: { top: 32, left: 44, right: 16, bottom: 28 },
    xAxis: { type: "category", data: setupPerDay.dates, ...AXIS },
    yAxis: { type: "value", ...AXIS, axisLabel: { ...AXIS.axisLabel, formatter: `{value} ${t("common.unit.min")}` } },
    series: [
      {
        name: t("process.series.setupStandar"),
        type: "line",
        smooth: true,
        symbol: "none",
        data: setupPerDay.std,
        lineStyle: { width: 2, color: "#0e7490", type: "dashed" },
      },
      {
        name: t("process.series.setupAktual"),
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 5,
        data: setupPerDay.act,
        lineStyle: { width: 3, color: "#f59e0b" },
        itemStyle: { color: "#f59e0b" },
        areaStyle: {
          color: {
            type: "linear", x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(245,158,11,0.25)" },
              { offset: 1, color: "rgba(245,158,11,0)" },
            ],
          },
        },
      },
    ],
  };

  return (
    <div className="space-y-6">
      <header className="anim-fade-up">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-jade-300/50">{t("process.pilar")}</p>
        <h1 className="font-display jade-grad-text mt-2 text-3xl font-bold text-glow">{t("process.title")}</h1>
        <p className="mt-1.5 text-sm text-jade-300/50">{t("process.subtitle")}</p>
      </header>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <TiltPanel className="anim-fade-up p-5" intensity={6}>
          <div className="flex items-center gap-2 text-jade-300/60">
            <Gauge className="h-4 w-4 text-jade-400" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em]">{t("kpi.oee")}</p>
          </div>
          <p className="jade-grad-text font-display mt-3 text-4xl font-bold text-glow">{kpi.oee.toFixed(1)}%</p>
          <p className="mt-1 text-xs text-jade-300/50">{t("process.kpi.oeeFormula", { a: kpi.availability.toFixed(1), p: kpi.performance.toFixed(1), q: kpi.quality.toFixed(1) })}</p>
        </TiltPanel>
        <TiltPanel className="anim-fade-up p-5" intensity={6}>
          <div className="flex items-center gap-2 text-jade-300/60">
            <Clock className="h-4 w-4 text-jade-400" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em]">{t("process.kpi.taktTime")}</p>
          </div>
          <p className="jade-grad-text font-display mt-3 text-4xl font-bold text-glow">{formatSec(kpi.taktTimeSec)}</p>
          <p className="mt-1 text-xs text-jade-300/50">{t("process.kpi.taktBenchmark")}</p>
        </TiltPanel>
        <TiltPanel className="anim-fade-up p-5" intensity={6}>
          <div className="flex items-center gap-2 text-jade-300/60">
            <Timer className="h-4 w-4 text-jade-400" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em]">{t("process.kpi.cycleAchievement")}</p>
          </div>
          <p className="jade-grad-text font-display mt-3 text-4xl font-bold text-glow">{kpi.cycleTimeAchievement.toFixed(1)}%</p>
          <p className="mt-1 text-xs text-jade-300/50">{t("process.kpi.cycleVsTarget", { act: formatSec(63), tgt: formatSec(60) })}</p>
        </TiltPanel>
        <TiltPanel className="anim-fade-up p-5" intensity={6}>
          <div className="flex items-center gap-2 text-jade-300/60">
            <Scale className="h-4 w-4 text-jade-400" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em]">{t("process.kpi.setupAchievement")}</p>
          </div>
          <p className="jade-grad-text font-display mt-3 text-4xl font-bold text-glow">{kpi.setupAchievement.toFixed(1)}%</p>
          <p className="mt-1 text-xs text-jade-300/50">{t("process.kpi.setupVariance", { v: `${kpi.setupVarianceMin >= 0 ? "+" : ""}${kpi.setupVarianceMin.toFixed(0)}` })}</p>
        </TiltPanel>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <TiltPanel className="anim-fade-up" intensity={3}>
          <PanelHeader icon={<Gauge className="h-4 w-4" />} title={t("process.chart.oee")} subtitle={t("process.chart.oeeSub")} />
          <Chart option={oeeBreakdown} height={280} className="px-2 pb-2" />
        </TiltPanel>

        <TiltPanel className="anim-fade-up" intensity={3}>
          <PanelHeader icon={<Layers className="h-4 w-4" />} title={t("process.chart.lineBalance")} subtitle={t("process.chart.bottleneck", { station: bottleneck.station, sec: bottleneck.cycleTimeSec })} />
          <Chart option={lineBalance} height={280} className="px-2 pb-2" />
        </TiltPanel>

        <TiltPanel className="anim-fade-up" intensity={3}>
          <PanelHeader icon={<Timer className="h-4 w-4" />} title={t("process.kpi.cycleAchievement")} subtitle={t("process.chart.cycleAchievementSub")} />
          <Chart option={cycleAchievement} height={280} className="px-2 pb-2" />
        </TiltPanel>

        <TiltPanel className="anim-fade-up" intensity={3}>
          <PanelHeader icon={<Clock className="h-4 w-4" />} title={t("process.chart.setup")} subtitle={t("process.chart.setupSub", { std: 33 })} />
          <Chart option={setupTren} height={280} className="px-2 pb-2" />
        </TiltPanel>
      </div>
    </div>
  );
}
