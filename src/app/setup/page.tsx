"use client";

import { useMemo } from "react";
import { Timer, Target, TrendingUp, Activity, LayoutGrid, Table2 } from "lucide-react";
import { Chart } from "@/components/chart";
import { TiltPanel } from "@/components/tilt-panel";
import { PanelHeader } from "@/components/panel-header";
import { useRawRows } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";

const AXIS = {
  axisLine: { lineStyle: { color: "rgba(0,179,172,0.15)" } },
  axisLabel: { color: "rgba(143,240,234,0.55)", fontSize: 10 },
  splitLine: { lineStyle: { color: "rgba(0,179,172,0.06)" } },
};

const TOOLTIP = {
  backgroundColor: "rgba(3,9,13,0.95)",
  borderColor: "rgba(0,179,172,0.35)",
  textStyle: { color: "#d3faf6" },
};

const LEGEND = {
  textStyle: { color: "rgba(143,240,234,0.7)", fontSize: 11 },
  top: 0,
  icon: "roundRect",
  itemWidth: 14,
  itemHeight: 6,
};

function avg(nums: number[]) {
  return nums.reduce((a, b) => a + b, 0) / Math.max(1, nums.length);
}

export default function SetupPage() {
  const { t } = useI18n();
  const rows = useRawRows();

  const summary = useMemo(() => {
    const stdSum = rows.reduce((a, r) => a + r.standardSetupMin, 0);
    const actSum = rows.reduce((a, r) => a + r.actualSetupMin, 0);
    return {
      avgStd: stdSum / Math.max(1, rows.length),
      avgAct: actSum / Math.max(1, rows.length),
      variance: actSum - stdSum,
      achievement: actSum > 0 ? (stdSum / actSum) * 100 : 0,
    };
  }, [rows]);

  const byModel = useMemo(() => {
    const map = new Map<string, { std: number[]; act: number[] }>();
    for (const r of rows) {
      const e = map.get(r.model) ?? { std: [], act: [] };
      e.std.push(r.standardSetupMin);
      e.act.push(r.actualSetupMin);
      map.set(r.model, e);
    }
    return [...map.entries()].map(([model, v]) => ({
      model,
      std: avg(v.std),
      act: avg(v.act),
    }));
  }, [rows]);

  const byLine = useMemo(() => {
    const map = new Map<string, { std: number[]; act: number[] }>();
    for (const r of rows) {
      const e = map.get(r.line) ?? { std: [], act: [] };
      e.std.push(r.standardSetupMin);
      e.act.push(r.actualSetupMin);
      map.set(r.line, e);
    }
    return [...map.entries()].map(([line, v]) => ({
      line,
      std: avg(v.std),
      act: avg(v.act),
    }));
  }, [rows]);

  const trenSetup = useMemo(() => {
    const map = new Map<string, { std: number[]; act: number[] }>();
    for (const r of rows) {
      const e = map.get(r.date) ?? { std: [], act: [] };
      e.std.push(r.standardSetupMin);
      e.act.push(r.actualSetupMin);
      map.set(r.date, e);
    }
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-30)
      .map(([date, v]) => ({ date, std: avg(v.std), act: avg(v.act) }));
  }, [rows]);

  const perModel = useMemo(() => {
    const map = new Map<
      string,
      { lines: Map<string, { count: number; last: number }>; std: number[]; act: number[] }
    >();
    rows.forEach((r, i) => {
      let e = map.get(r.model);
      if (!e) {
        e = { lines: new Map(), std: [], act: [] };
        map.set(r.model, e);
      }
      e.std.push(r.standardSetupMin);
      e.act.push(r.actualSetupMin);
      const l = e.lines.get(r.line);
      if (l) {
        l.count++;
        l.last = i;
      } else {
        e.lines.set(r.line, { count: 1, last: i });
      }
    });
    return [...map.entries()].map(([model, e]) => {
      const line = [...e.lines.entries()].sort(
        (a, b) => b[1].count - a[1].count || b[1].last - a[1].last
      )[0][0];
      const std = avg(e.std);
      const act = avg(e.act);
      return { model, line, std, act, variance: act - std, achievement: (std / act) * 100 };
    });
  }, [rows]);

  const modelOption = {
    tooltip: { ...TOOLTIP, trigger: "axis" },
    legend: { ...LEGEND },
    grid: { top: 36, left: 44, right: 16, bottom: 24 },
    xAxis: { type: "category", data: byModel.map((m) => m.model), ...AXIS },
    yAxis: { type: "value", ...AXIS, axisLabel: { ...AXIS.axisLabel, formatter: `{value} ${t("common.unit.min")}` } },
    series: [
      {
        name: t("series.standar"),
        type: "bar",
        barWidth: 18,
        data: byModel.map((m) => +m.std.toFixed(1)),
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: {
            type: "linear", x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "#00b3ac" },
              { offset: 1, color: "#0a5b63" },
            ],
          },
        },
      },
      {
        name: t("series.aktual"),
        type: "bar",
        barWidth: 18,
        data: byModel.map((m) => +m.act.toFixed(1)),
        itemStyle: { borderRadius: [6, 6, 0, 0], color: "#f59e0b" },
      },
    ],
  };

  const lineOption = {
    tooltip: { ...TOOLTIP, trigger: "axis" },
    legend: { ...LEGEND },
    grid: { top: 36, left: 44, right: 16, bottom: 24 },
    xAxis: { type: "category", data: byLine.map((l) => l.line), ...AXIS },
    yAxis: { type: "value", ...AXIS, axisLabel: { ...AXIS.axisLabel, formatter: `{value} ${t("common.unit.min")}` } },
    series: [
      {
        name: t("series.standar"),
        type: "bar",
        barWidth: 18,
        data: byLine.map((l) => +l.std.toFixed(1)),
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: {
            type: "linear", x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "#00b3ac" },
              { offset: 1, color: "#0a5b63" },
            ],
          },
        },
      },
      {
        name: t("series.aktual"),
        type: "bar",
        barWidth: 18,
        data: byLine.map((l) => +l.act.toFixed(1)),
        itemStyle: { borderRadius: [6, 6, 0, 0], color: "#f59e0b" },
      },
    ],
  };

  const trenOption = {
    tooltip: { ...TOOLTIP, trigger: "axis" },
    legend: { ...LEGEND },
    grid: { top: 36, left: 44, right: 16, bottom: 24 },
    xAxis: { type: "category", data: trenSetup.map((t) => t.date.slice(5)), ...AXIS },
    yAxis: { type: "value", ...AXIS, axisLabel: { ...AXIS.axisLabel, formatter: `{value} ${t("common.unit.min")}` } },
    series: [
      {
        name: t("series.standar"),
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 4,
        data: trenSetup.map((t) => +t.std.toFixed(1)),
        lineStyle: { width: 2, color: "#00b3ac", type: "dashed" },
        itemStyle: { color: "#00b3ac" },
      },
      {
        name: t("series.aktual"),
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 4,
        data: trenSetup.map((t) => +t.act.toFixed(1)),
        lineStyle: { width: 2.5, color: "#f59e0b" },
        itemStyle: { color: "#f59e0b" },
      },
    ],
  };

  return (
    <div className="space-y-6">
      <header className="anim-fade-up">
        <p className="lux-eyebrow">
          {t("setup.phase")}
        </p>
        <h1 className="font-display text-hisense-gradient mt-2 text-4xl font-semibold text-shadow-luxe lg:text-5xl">
          {t("setup.title")}
        </h1>
        <p className="mt-1.5 text-sm text-hisense-soft/50">
          {t("setup.subtitle")}
        </p>
      </header>

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <TiltPanel className="anim-fade-up p-5" intensity={6}>
          <div className="flex items-center gap-2 text-hisense-soft/60">
            <Timer className="h-4 w-4 text-hisense" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em]">{t("setup.kpi.avgActual")}</p>
          </div>
          <p className="lux-gold-text font-display mt-3 text-4xl font-bold text-shadow-luxe">
            {summary.avgAct.toFixed(1)}<span className="text-lg"> {t("common.unit.min")}</span>
          </p>
          <p className="mt-1 text-xs text-hisense-soft/50">{t("setup.kpi.avgActualSub", { n: rows.length })}</p>
        </TiltPanel>

        <TiltPanel className="anim-fade-up p-5" intensity={6}>
          <div className="flex items-center gap-2 text-hisense-soft/60">
            <Target className="h-4 w-4 text-hisense" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em]">{t("setup.kpi.avgStandard")}</p>
          </div>
          <p className="text-hisense-gradient font-display mt-3 text-4xl font-bold text-shadow-luxe">
            {summary.avgStd.toFixed(1)}<span className="text-lg"> {t("common.unit.min")}</span>
          </p>
          <p className="mt-1 text-xs text-hisense-soft/50">{t("setup.kpi.avgStandardSub")}</p>
        </TiltPanel>

        <TiltPanel className="anim-fade-up p-5" intensity={6}>
          <div className={cn("flex items-center gap-2", summary.variance > 0 ? "text-red-400/70" : "text-hisense-soft/60")}>
            <TrendingUp className={cn("h-4 w-4", summary.variance > 0 ? "text-red-400" : "text-hisense")} />
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em]">{t("setup.kpi.totalVariance")}</p>
          </div>
          <p className={cn("font-display mt-3 text-4xl font-bold text-shadow-luxe", summary.variance > 0 ? "text-red-400" : "text-hisense")}>
            {summary.variance > 0 ? "+" : ""}{summary.variance.toFixed(0)}
            <span className="text-lg"> {t("common.unit.min")}</span>
          </p>
          <p className="mt-1 text-xs text-hisense-soft/50">
            {summary.variance > 0 ? t("setup.kpi.varianceSlower") : t("setup.kpi.varianceFaster")}
          </p>
        </TiltPanel>

        <TiltPanel className="anim-fade-up p-5" intensity={6}>
          <div className="flex items-center gap-2 text-hisense-soft/60">
            <Activity className="h-4 w-4 text-gold-400" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em]">{t("setup.kpi.achievement")}</p>
          </div>
          <p className="lux-gold-text font-display mt-3 text-4xl font-bold text-shadow-luxe">
            {summary.achievement.toFixed(1)}<span className="text-lg">%</span>
          </p>
          <p className="mt-1 text-xs text-hisense-soft/50">{t("setup.kpi.achievementSub")}</p>
        </TiltPanel>
      </section>

      <div className="lux-divider" />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <TiltPanel className="anim-fade-up" intensity={3}>
          <PanelHeader icon={<LayoutGrid className="h-4 w-4" />} title={t("setup.chart.perModel")} subtitle={t("setup.chart.avgSub")} />
          <Chart option={modelOption} height={280} className="px-2 pb-2" />
        </TiltPanel>

        <TiltPanel className="anim-fade-up" intensity={3}>
          <PanelHeader icon={<Activity className="h-4 w-4" />} title={t("setup.chart.perLine")} subtitle={t("setup.chart.avgSub")} />
          <Chart option={lineOption} height={280} className="px-2 pb-2" />
        </TiltPanel>

        <TiltPanel className="anim-fade-up xl:col-span-2" intensity={3}>
          <PanelHeader icon={<TrendingUp className="h-4 w-4" />} title={t("setup.chart.dailyTrend")} subtitle={t("setup.chart.dailyTrendSub")} />
          <Chart option={trenOption} height={300} className="px-2 pb-2" />
        </TiltPanel>
      </div>

      <div className="lux-divider" />

      <TiltPanel className="anim-fade-up" intensity={2}>
        <PanelHeader icon={<Table2 className="h-4 w-4" />} title={t("setup.table.title")} subtitle={t("setup.table.subtitle")} />
        <div className="overflow-x-auto px-5 pb-5 pt-4">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-hisense/15 text-[11px] uppercase tracking-wider text-hisense-soft/50">
                <th className="pb-3 pr-4 font-semibold">{t("setup.table.model")}</th>
                <th className="pb-3 pr-4 font-semibold">{t("setup.table.line")}</th>
                <th className="pb-3 pr-4 font-semibold">{t("setup.table.setupStandard")}</th>
                <th className="pb-3 pr-4 font-semibold">{t("setup.table.setupActual")}</th>
                <th className="pb-3 pr-4 font-semibold">{t("setup.table.variance")}</th>
                <th className="pb-3 font-semibold">{t("setup.table.achievement")}</th>
              </tr>
            </thead>
            <tbody>
              {perModel.map((m) => (
                <tr key={m.model} className="border-b border-hisense/8 transition-colors hover:bg-hisense/5">
                  <td className="py-3 pr-4 font-medium text-hisense-soft">{m.model}</td>
                  <td className="py-3 pr-4 text-hisense-soft/70">{m.line}</td>
                  <td className="py-3 pr-4 font-mono text-xs text-hisense-soft/80">{m.std.toFixed(1)} {t("common.unit.min")}</td>
                  <td className="py-3 pr-4 font-mono text-xs text-hisense-soft/80">{m.act.toFixed(1)} {t("common.unit.min")}</td>
                  <td className="py-3 pr-4 font-mono text-xs">
                    <span className={m.variance > 0 ? "text-red-400" : "text-hisense"}>
                      {m.variance > 0 ? "+" : ""}{m.variance.toFixed(1)} {t("common.unit.min")}
                    </span>
                  </td>
                  <td className="py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px]",
                        m.achievement >= 100
                          ? "border-hisense/30 bg-hisense/10 text-hisense-soft"
                          : "border-gold-400/30 bg-gold-400/10 text-gold-300"
                      )}
                    >
                      {m.achievement.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TiltPanel>
    </div>
  );
}
