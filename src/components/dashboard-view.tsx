"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Target,
  Gauge,
  Scale,
  Timer,
  ShieldCheck,
  TrendingUp,
  BarChart3,
  Clock,
  AlertTriangle,
  BellRing,
} from "lucide-react";
import { Chart } from "@/components/chart";
import { TiltPanel } from "@/components/tilt-panel";
import { KpiCard } from "@/components/kpi-card";
import { kalkulasiKpi, ambilTren, ambilPareto } from "@/lib/kalkulator";
import { useRawRows } from "@/lib/store";
import { useEngineering } from "@/lib/store-engineering";
import { ISSUES } from "@/lib/data";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

const AXIS = {
  axisLine: { lineStyle: { color: "rgba(0,179,172,0.15)" } },
  axisLabel: { color: "rgba(143,240,234,0.5)", fontSize: 10 },
  splitLine: { lineStyle: { color: "rgba(0,179,172,0.06)" } },
};

const TOOLTIP = {
  backgroundColor: "rgba(3,9,13,0.95)",
  borderColor: "rgba(0,179,172,0.35)",
  textStyle: { color: "#d3faf6" },
};

function DelayedChart({
  delay,
  option,
  height,
  className,
}: {
  delay: number;
  option: Parameters<typeof Chart>[0]["option"];
  height?: number;
  className?: string;
}) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div className={cn("anim-fade-up", className)} style={{ animationDelay: `${delay}ms` }}>
      {show ? <Chart option={option} height={height} /> : <div style={{ height }} />}
    </div>
  );
}

export function DashboardView({
  periode,
  range,
  animFrom = 360,
}: {
  periode: 1 | 7 | 14 | 30;
  range?: { from: string; to: string } | null;
  animFrom?: number;
}) {
  const { t } = useI18n();
  const rows = useRawRows();
  const eng = useEngineering();
  const [cat, setCat] = useState<"" | "IDU" | "ODU">("");

  const today = new Date().toISOString().slice(0, 10);
  const overdueCount = ISSUES.filter((i) => i.status !== "closed" && i.dueDate < today).length;

  const filteredRows = useMemo(() => {
    let list = rows;
    if (range) {
      list = rows.filter((r) => r.date >= range.from && r.date <= range.to);
    } else {
      const dates = [...new Set(rows.map((r) => r.date))]
        .sort((a, b) => b.localeCompare(a))
        .slice(0, periode);
      const keep = new Set(dates);
      list = rows.filter((r) => keep.has(r.date));
    }
    if (cat) list = list.filter((r) => r.category === cat);
    return list;
  }, [rows, periode, range, cat]);

  const kpi = useMemo(() => kalkulasiKpi(filteredRows, eng), [filteredRows, eng]);
  const tren = useMemo(() => ambilTren(filteredRows), [filteredRows]);
  const pareto = useMemo(() => ambilPareto(filteredRows), [filteredRows]);

  const setupWarning = kpi.setupVarianceMin > 0;
  const dates = tren.map((t) => t.date);

  const trenOption = useMemo(
    () => ({
      tooltip: { ...TOOLTIP, trigger: "axis" },
      legend: {
        textStyle: { color: "#e6eef2", fontSize: 22, fontWeight: 600, fontFamily: "Playfair Display, Georgia, serif" },
        top: 6,
        left: "center",
        icon: "roundRect",
        itemWidth: 28,
        itemHeight: 11,
        itemGap: 32,
      },
      grid: { top: 64, left: 44, right: 16, bottom: 24 },
      xAxis: { type: "category", data: dates, ...AXIS },
      yAxis: {
        type: "value",
        min: 60,
        max: 100,
        ...AXIS,
        axisLabel: { ...AXIS.axisLabel, formatter: "{value}%" },
      },
      series: [
        {
          name: "OEE",
          type: "line",
          smooth: true,
          symbol: "circle",
          symbolSize: 5,
          data: tren.map((t) => +t.oee.toFixed(1)),
          lineStyle: { width: 3, color: "#3b82f6" },
          itemStyle: { color: "#3b82f6", borderColor: "#03090d", borderWidth: 1 },
          areaStyle: {
            color: {
              type: "linear",
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(59,130,246,0.3)" },
              { offset: 1, color: "rgba(59,130,246,0)" },
            ],
          },
        },
      },
      {
        name: "FPY",
        type: "line",
        smooth: true,
        symbol: "none",
        data: tren.map((t) => +t.fpy.toFixed(1)),
        lineStyle: { width: 2, color: "#f97316" },
        itemStyle: { color: "#f97316" },
      },
      {
        name: "Line Balance",
        type: "line",
        smooth: true,
        symbol: "none",
        data: tren.map((t) => +t.lineBalance.toFixed(1)),
        lineStyle: { width: 2, color: "#a78bfa" },
        itemStyle: { color: "#a78bfa" },
      },
    ],
    }),
    [dates, tren]
  );

  const paretoData = useMemo(() => pareto.map((p) => p.defects), [pareto]);
  const paretoOption = useMemo(
    () => ({
    tooltip: { ...TOOLTIP, trigger: "axis" },
    grid: { top: 24, left: 44, right: 44, bottom: 28 },
    xAxis: { type: "category", data: pareto.map((p) => p.model), ...AXIS },
    yAxis: [
      { type: "value", ...AXIS },
      {
        type: "value",
        max: 100,
        ...AXIS,
        axisLabel: { ...AXIS.axisLabel, formatter: "{value}%" },
      },
    ],
    series: [
      {
        name: "Jumlah Cacat",
        type: "bar",
        data: paretoData,
        barWidth: 34,
        itemStyle: {
          borderRadius: [8, 8, 0, 0],
          color: {
            type: "linear",
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "#a78bfa" },
              { offset: 1, color: "#5b21b6" },
            ],
          },
        },
      },
      {
        name: "Kumulatif",
        type: "line",
        yAxisIndex: 1,
        data: pareto.map((p) => +p.cumulativePct.toFixed(1)),
        symbol: "circle",
        symbolSize: 7,
        lineStyle: { width: 2, color: "#f59e0b" },
        itemStyle: { color: "#f59e0b", borderColor: "#03090d", borderWidth: 1 },
      },
    ],
    }),
    [pareto, paretoData]
  );

  const setupOption = useMemo(
    () => ({
    tooltip: { ...TOOLTIP },
    grid: { top: 20, left: 60, right: 24, bottom: 24 },
    xAxis: {
      type: "category",
      data: ["Standar", "Aktual"],
      ...AXIS,
      axisTick: { show: false },
    },
    yAxis: { type: "value", ...AXIS, axisLabel: { ...AXIS.axisLabel, formatter: "{value} min" } },
    series: [
      {
        type: "bar",
        data: [
          { value: 33, itemStyle: { color: "#34d399" } },
          { value: 42, itemStyle: { color: "#f59e0b" } },
        ],
        barWidth: 48,
        label: {
          show: true,
          position: "top",
          color: "#d3faf6",
          fontSize: 12,
          formatter: "{c} min",
        },
        itemStyle: { borderRadius: [10, 10, 0, 0] },
      },
    ],
    }),
    []
  );

  const cycleOption = useMemo(
    () => ({
    tooltip: { ...TOOLTIP },
    grid: { top: 20, left: 56, right: 24, bottom: 24 },
    xAxis: {
      type: "category",
      data: ["Target", "Takt Time", "Aktual"],
      ...AXIS,
      axisTick: { show: false },
    },
    yAxis: { type: "value", ...AXIS, axisLabel: { ...AXIS.axisLabel, formatter: "{value} sec" } },
    series: [
      {
        type: "bar",
        data: [
          { value: 60, itemStyle: { color: "#fbbf24" } },
          { value: 69, itemStyle: { color: "rgba(96,165,250,0.4)" } },
          { value: 63, itemStyle: { color: "#4ade80" } },
        ],
        barWidth: 44,
        label: { show: true, position: "top", color: "#d3faf6", fontSize: 12, formatter: "{c} sec" },
        itemStyle: { borderRadius: [10, 10, 0, 0] },
      },
    ],
    }),
    []
  );

  const issueOption = useMemo(
    () => ({
    tooltip: { ...TOOLTIP },
    series: [
      {
        type: "pie",
        radius: ["52%", "76%"],
        center: ["50%", "52%"],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 8, borderColor: "#03090d", borderWidth: 3 },
        label: { show: false },
        emphasis: { label: { show: true, color: "#d3faf6", fontSize: 14 } },
        data: [
          { name: "Closed", value: 5, itemStyle: { color: "#34d399" } },
          { name: "Progress", value: 4, itemStyle: { color: "#f59e0b" } },
          { name: "Overdue", value: 1, itemStyle: { color: "#ef4444" } },
        ],
      },
    ],
    graphic: [
      {
        type: "text",
        left: "center",
        top: "40%",
        style: { text: "5/10", fill: "#8ff0ea", fontSize: 26, fontWeight: 700 },
      },
      {
        type: "text",
        left: "center",
        top: "52%",
        style: { text: "isu tertutup", fill: "rgba(143,240,234,0.45)", fontSize: 11 },
      },
    ],
    }),
    []
  );

  return (
    <div className="space-y-6">
      <div className="anim-fade-up flex justify-end">
        <div className="flex items-center gap-1.5 rounded-full border border-hisense/15 bg-obsidian-850/60 p-1.5">
          {([["", t("dash.catSemua")], ["IDU", "IDU"], ["ODU", "ODU"]] as const).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setCat(value)}
              className={cn(
                "font-cinzel rounded-full border px-4 py-1.5 text-xs font-medium tracking-wide transition-colors",
                cat === value ? "border-hisense/60 bg-hisense/15 text-hisense-soft" : "border-hisense/10 text-hisense-soft/75 hover:text-hisense-soft"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {overdueCount > 0 && (
        <div
          className="anim-fade-up flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/[0.06] px-5 py-3 text-sm text-red-200 shadow-[0_0_28px_-10px_rgba(239,68,68,0.35)]"
          style={{ animationDelay: `${animFrom}ms` }}
        >
          <BellRing className="h-4 w-4 shrink-0 animate-pulse text-red-400" />
          <span>{t("alert.overdue", { n: overdueCount })}</span>
        </div>
      )}

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label={t("kpi.fpy")} value={`${kpi.fpy.toFixed(1)}%`} sub={t("kpi.fpySub")} icon={<Target className="h-6 w-6" />} accent="jade" spark={[97.2, 98, 98.4, 98.1, 98.7, 98.4]} delay={520} />
        <KpiCard label={t("kpi.oee")} value={`${kpi.oee.toFixed(1)}%`} sub={t("kpi.oeeSub")} icon={<Gauge className="h-6 w-6" />} accent="teal" spark={[88, 90, 89.5, 92, 91, 91.2]} delay={640} />
        <KpiCard label={t("kpi.lineBalance")} value={`${kpi.lineBalance.toFixed(1)}%`} sub={t("kpi.lineBalanceSub")} icon={<Scale className="h-6 w-6" />} accent="emerald" spark={[90, 92, 93, 94, 93.5, 94.3]} delay={760} />
        <KpiCard label={t("kpi.setupTime")} value={`${kpi.avgActualSetupMin.toFixed(0)} min`} sub={t("kpi.setupTimeSub", { var: `${kpi.setupVarianceMin >= 0 ? "+" : ""}${kpi.setupVarianceMin.toFixed(0)}` })} icon={<Timer className="h-6 w-6" />} accent="gold" spark={[48, 45, 44, 46, 41, 42]} delay={880} alert={setupWarning ? "warning" : undefined} />
        <KpiCard label={t("kpi.issueClosure")} value={`${kpi.issueClosure.toFixed(0)}%`} sub={t("kpi.issueClosureSub")} icon={<ShieldCheck className="h-6 w-6" />} accent="rose" spark={[30, 40, 40, 45, 50, 50]} delay={1000} alert={overdueCount > 0 ? "critical" : undefined} />
      </section>

      <div className="lux-divider" />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <TiltPanel className={cn("anim-fade-up xl:col-span-3", overdueCount > 0 && "alert-glow-red")} intensity={3} glow={false}>
          <PanelHeader icon={<TrendingUp className="h-4 w-4" />} title={t("chart.engineeringTrend")} subtitle={range ? `${range.from} — ${range.to}` : t("chart.engineeringTrendSub", { p: periode === 1 ? t("dash.periodeHariIni") : t("dash.periodeTerakhir", { n: periode }) })} />
          <DelayedChart delay={1250} option={trenOption} height={300} className="px-2 pb-2" />
        </TiltPanel>

        <TiltPanel className="anim-fade-up xl:col-span-2" intensity={3} glow={false}>
          <PanelHeader icon={<BarChart3 className="h-4 w-4" />} title={t("chart.defectPareto")} subtitle={t("chart.defectParetoSub")} />
          <DelayedChart delay={1400} option={paretoOption} height={300} className="px-2 pb-2" />
        </TiltPanel>

        <TiltPanel className={cn("anim-fade-up xl:col-span-2", setupWarning && "alert-glow-amber")} intensity={3} glow={false}>
          <PanelHeader icon={<Clock className="h-4 w-4" />} title={t("chart.setupVsStandard")} subtitle={t("chart.setupVsStandardSub")} />
          <DelayedChart delay={1550} option={setupOption} height={280} className="px-2 pb-2" />
        </TiltPanel>

        <TiltPanel className="anim-fade-up xl:col-span-2" intensity={3} glow={false}>
          <PanelHeader icon={<Timer className="h-4 w-4" />} title={t("chart.cycleVsTarget")} subtitle={t("chart.cycleVsTargetSub", { pct: "95.2", takt: "69" })} />
          <DelayedChart delay={1700} option={cycleOption} height={280} className="px-2 pb-2" />
        </TiltPanel>

        <TiltPanel className={cn("anim-fade-up xl:col-span-1", overdueCount > 0 && "alert-glow-red")} intensity={3} glow={false}>
          <PanelHeader icon={<AlertTriangle className="h-4 w-4" />} title={t("chart.issueStatus")} subtitle={t("chart.issueStatusSub")} />
          <DelayedChart delay={1850} option={issueOption} height={280} className="px-2 pb-2" />
        </TiltPanel>
      </div>
    </div>
  );
}

function PanelHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3 px-5 pt-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-hisense/25 bg-hisense/10 text-hisense-soft">
        {icon}
      </div>
      <div>
        <h3 className="font-display text-3xl font-semibold tracking-wide text-hisense-soft text-shadow-luxe">{title}</h3>
        <p className="mt-1 text-base text-hisense-soft/70">{subtitle}</p>
      </div>
    </div>
  );
}
