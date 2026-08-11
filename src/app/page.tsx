"use client";

import { useMemo, useState, useEffect } from "react";
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
  Hexagon,
  BellRing,
} from "lucide-react";
import { Chart } from "@/components/chart";
import { TiltPanel } from "@/components/tilt-panel";
import { KpiCard } from "@/components/kpi-card";
import { kalkulasiKpi, ambilTren, ambilPareto } from "@/lib/kalkulator";
import { useRawRows } from "@/lib/store";
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

export default function DashboardPage() {
  const { t } = useI18n();
  const rows = useRawRows();
  const [periode, setPeriode] = useState<1 | 7 | 14 | 30>(30);

  const today = new Date().toISOString().slice(0, 10);
  const overdueCount = ISSUES.filter((i) => i.status !== "closed" && i.dueDate < today).length;

  const filteredRows = useMemo(() => {
    const dates = [...new Set(rows.map((r) => r.date))]
      .sort((a, b) => b.localeCompare(a))
      .slice(0, periode);
    const keep = new Set(dates);
    return rows.filter((r) => keep.has(r.date));
  }, [rows, periode]);

  const kpi = useMemo(() => kalkulasiKpi(filteredRows), [filteredRows]);
  const tren = useMemo(() => ambilTren(filteredRows), [filteredRows]);
  const pareto = useMemo(() => ambilPareto(filteredRows), [filteredRows]);

  const setupWarning = kpi.setupVarianceMin > 0;
  const dates = tren.map((t) => t.date);

  const trenOption = useMemo(
    () => ({
      tooltip: { ...TOOLTIP, trigger: "axis" },
      legend: {
        textStyle: { color: "rgba(143,240,234,0.65)", fontSize: 11 },
        top: 0,
        icon: "roundRect",
        itemWidth: 14,
        itemHeight: 6,
      },
      grid: { top: 36, left: 44, right: 16, bottom: 24 },
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
          lineStyle: { width: 3, color: "#22d3ee" },
          itemStyle: { color: "#22d3ee", borderColor: "#03090d", borderWidth: 1 },
          areaStyle: {
            color: {
              type: "linear",
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(34,211,238,0.3)" },
              { offset: 1, color: "rgba(34,211,238,0)" },
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
        lineStyle: { width: 2, color: "#f59e0b" },
        itemStyle: { color: "#f59e0b" },
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
      <header className="anim-fade-up flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className="anim-scale-in relative hidden sm:block"
            style={{ animationDelay: "150ms" }}
          >
            <div className="glow-ring absolute -inset-2 animate-pulse-glow opacity-50" />
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-hisense to-obsidian-700 shadow-lg shadow-hisense/25">
              <Hexagon className="h-6 w-6 text-obsidian-950" strokeWidth={2.4} />
            </div>
          </div>
          <div>
            <h1
              className="anim-fade-up font-display text-hisense-gradient mt-2 text-4xl font-semibold tracking-wide text-shadow-luxe lg:text-5xl"
              style={{ animationDelay: "160ms" }}
            >
              {t("dash.title")}
            </h1>
            <p
              className="anim-fade-up mt-1.5 text-sm text-hisense-soft/75"
              style={{ animationDelay: "240ms" }}
            >
              {t("dash.subtitle", { date: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) })}
            </p>
          </div>
        </div>
        <div className="anim-fade-up flex flex-wrap items-center gap-3" style={{ animationDelay: "320ms" }}>
          <div className="flex items-center gap-1.5 rounded-full border border-hisense/15 bg-obsidian-850/60 p-1.5">
            {([1, 7, 14, 30] as const).map((n) => (
              <button
                key={n}
                onClick={() => setPeriode(n)}
                className={cn(
                  "font-cinzel rounded-full border px-4 py-1.5 text-xs font-medium tracking-wide transition-colors",
                  periode === n
                    ? "border-hisense/60 bg-hisense/15 text-hisense-soft"
                    : "border-hisense/10 text-hisense-soft/75 hover:text-hisense-soft"
                )}
              >
                {n === 1 ? t("periode.harian") : t("periode.hari", { n })}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2.5 rounded-full border border-hisense/20 bg-obsidian-850/60 px-4 py-2 font-cinzel text-xs tracking-wide text-hisense-soft/70">
            <span className="live-dot" />
            {t("dash.live")}
          </div>
        </div>
      </header>

      {overdueCount > 0 && (
        <div
          className="anim-fade-up flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/[0.06] px-5 py-3 text-sm text-red-200 shadow-[0_0_28px_-10px_rgba(239,68,68,0.35)]"
          style={{ animationDelay: "420ms" }}
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
          <PanelHeader icon={<TrendingUp className="h-4 w-4" />} title={t("chart.engineeringTrend")} subtitle={t("chart.engineeringTrendSub", { p: periode === 1 ? t("dash.periodeHariIni") : t("dash.periodeTerakhir", { n: periode }) })} />
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
