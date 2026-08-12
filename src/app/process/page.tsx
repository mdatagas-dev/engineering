"use client";

import { useMemo } from "react";
import { Gauge, Timer, Scale, TrendingUp, Clock } from "lucide-react";
import { Chart } from "@/components/chart";
import { TiltPanel } from "@/components/tilt-panel";
import { PanelHeader } from "@/components/panel-header";
import { kalkulasiKpi, ambilTren } from "@/lib/kalkulator";
import { useRawRows } from "@/lib/store";
import { formatSec } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";

const AXIS = {
  axisLine: { lineStyle: { color: "rgba(0,179,172,0.15)" } },
  axisLabel: { color: "rgba(100,116,139,0.85)", fontSize: 10 },
  splitLine: { lineStyle: { color: "rgba(0,179,172,0.06)" } },
};
const TOOLTIP = {
  backgroundColor: "rgba(3,9,13,0.95)",
  borderColor: "rgba(0,179,172,0.35)",
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
          { name: t("process.pie.availability"), value: +kpi.availability.toFixed(1), itemStyle: { color: "#22d3ee" } },
          { name: t("process.pie.performance"), value: +kpi.performance.toFixed(1), itemStyle: { color: "#a78bfa" } },
          { name: t("process.pie.quality"), value: +kpi.quality.toFixed(1), itemStyle: { color: "#f59e0b" } },
        ],
      },
    ],
  };

  const perLine = useMemo(() => {
    const lines = [...new Set(rows.map((r) => r.line))];
    return lines.map((line) => ({
      line,
      achievement: kalkulasiKpi(rows.filter((r) => r.line === line)).outputAchievement,
    }));
  }, [rows]);

  const lineOutput = {
    tooltip: { ...TOOLTIP, trigger: "axis" },
    grid: { top: 28, left: 44, right: 16, bottom: 28 },
    xAxis: { type: "category", data: perLine.map((p) => p.line), ...AXIS },
    yAxis: { ...AXIS, axisLabel: { ...AXIS.axisLabel, formatter: "{value}%" } },
    series: [
      {
        name: t("process.kpi.outputAchievement"),
        type: "bar",
        data: perLine.map((p) => +p.achievement.toFixed(1)),
        barWidth: 36,
        label: { show: true, position: "top", color: "#d3faf6", fontSize: 11, formatter: "{c}%" },
        itemStyle: {
          borderRadius: [8, 8, 0, 0],
          color: {
            type: "linear",
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "#34d399" },
              { offset: 1, color: "#065f46" },
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

  const outputTrend = {
    tooltip: { ...TOOLTIP, trigger: "axis" },
    grid: { top: 28, left: 44, right: 16, bottom: 28 },
    xAxis: { type: "category", data: tren.map((t) => t.date), ...AXIS },
    yAxis: { ...AXIS, axisLabel: { ...AXIS.axisLabel, formatter: "{value}%" } },
    series: [
      {
        name: t("process.kpi.outputAchievement"),
        type: "line",
        smooth: true,
        symbol: "none",
        data: tren.map((t) => +t.outputAchievement.toFixed(1)),
        lineStyle: { width: 3, color: "#34d399" },
        areaStyle: {
          color: {
            type: "linear", x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(52,211,153,0.3)" },
              { offset: 1, color: "rgba(52,211,153,0)" },
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
      textStyle: { color: "rgba(100,116,139,0.85)", fontSize: 11 },
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
        lineStyle: { width: 2, color: "#22d3ee", type: "dashed" },
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
        <p className="lux-eyebrow">{t("process.pilar")}</p>
        <h1 className="font-display text-hisense-gradient mt-2 text-4xl font-semibold text-shadow-luxe lg:text-5xl">{t("process.title")}</h1>
        <p className="mt-1.5 text-sm text-hisense-soft/75">{t("process.subtitle")}</p>
      </header>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <TiltPanel className="anim-fade-up p-5" intensity={6}>
          <div className="flex items-center gap-2 text-hisense-soft/80">
            <Gauge className="h-4 w-4 text-hisense" />
            <p className="text-sm font-semibold uppercase tracking-[0.15em]">{t("kpi.oee")}</p>
          </div>
          <p className="lux-gold-text font-display mt-3 text-5xl font-bold lg:text-6xl text-shadow-luxe">{kpi.oee.toFixed(1)}%</p>
          <p className="mt-1.5 text-sm text-hisense-soft/65">{t("process.kpi.oeeFormula", { a: kpi.availability.toFixed(1), p: kpi.performance.toFixed(1), q: kpi.quality.toFixed(1) })}</p>
        </TiltPanel>
        <TiltPanel className="anim-fade-up p-5" intensity={6}>
          <div className="flex items-center gap-2 text-hisense-soft/80">
            <Clock className="h-4 w-4 text-hisense" />
            <p className="text-sm font-semibold uppercase tracking-[0.15em]">{t("process.kpi.taktTime")}</p>
          </div>
          <p
            className="font-display mt-3 text-5xl font-semibold lg:text-6xl leading-none tracking-tight text-shadow-luxe"
            style={{ color: "#60a5fa", textShadow: "0 0 24px #60a5fa55, 0 0 64px #60a5fa22" }}
          >
            {formatSec(kpi.taktTimeSec)}
          </p>
          <p className="mt-1.5 text-sm text-hisense-soft/65">{t("process.kpi.taktBenchmark")}</p>
        </TiltPanel>
        <TiltPanel className="anim-fade-up p-5" intensity={6}>
          <div className="flex items-center gap-2 text-hisense-soft/80">
            <Timer className="h-4 w-4 text-hisense" />
            <p className="text-sm font-semibold uppercase tracking-[0.15em]">{t("process.kpi.outputAchievement")}</p>
          </div>
          <p
            className="font-display mt-3 text-5xl font-semibold lg:text-6xl leading-none tracking-tight text-shadow-luxe"
            style={{ color: "#34d399", textShadow: "0 0 24px #34d39955, 0 0 64px #34d39922" }}
          >
            {kpi.outputAchievement.toFixed(1)}%
          </p>
          <p className="mt-1.5 text-sm text-hisense-soft/65">{t("process.kpi.outputDeviation", { v: `${kpi.efficiencyDeviation >= 0 ? "+" : ""}${kpi.efficiencyDeviation.toFixed(1)}%` })}</p>
        </TiltPanel>
        <TiltPanel className="anim-fade-up p-5" intensity={6}>
          <div className="flex items-center gap-2 text-hisense-soft/80">
            <Scale className="h-4 w-4 text-hisense" />
            <p className="text-sm font-semibold uppercase tracking-[0.15em]">{t("process.kpi.setupAchievement")}</p>
          </div>
          <p className="lux-gold-text font-display mt-3 text-5xl font-bold lg:text-6xl text-shadow-luxe">{kpi.setupAchievement.toFixed(1)}%</p>
          <p className="mt-1.5 text-sm text-hisense-soft/65">{t("process.kpi.setupVariance", { v: `${kpi.setupVarianceMin >= 0 ? "+" : ""}${kpi.setupVarianceMin.toFixed(0)}` })}</p>
        </TiltPanel>
      </div>

      <div className="lux-divider" />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <TiltPanel className="anim-fade-up" intensity={3}>
          <PanelHeader icon={<Gauge className="h-4 w-4" />} title={t("process.chart.oee")} subtitle={t("process.chart.oeeSub")} />
          <Chart option={oeeBreakdown} height={280} className="px-2 pb-2" />
        </TiltPanel>

        <TiltPanel className="anim-fade-up" intensity={3}>
          <PanelHeader icon={<TrendingUp className="h-4 w-4" />} title={t("process.chart.outputAchievement")} subtitle={t("process.chart.cycleAchievementSub")} />
          <Chart option={lineOutput} height={280} className="px-2 pb-2" />
        </TiltPanel>

        <TiltPanel className="anim-fade-up" intensity={3}>
          <PanelHeader icon={<TrendingUp className="h-4 w-4" />} title={t("process.kpi.outputAchievement")} subtitle={t("process.chart.cycleAchievementSub")} />
          <Chart option={outputTrend} height={280} className="px-2 pb-2" />
        </TiltPanel>

        <TiltPanel className="anim-fade-up" intensity={3}>
          <PanelHeader icon={<Clock className="h-4 w-4" />} title={t("process.chart.setup")} subtitle={t("process.chart.setupSub", { std: 33 })} />
          <Chart option={setupTren} height={280} className="px-2 pb-2" />
        </TiltPanel>
      </div>
    </div>
  );
}
