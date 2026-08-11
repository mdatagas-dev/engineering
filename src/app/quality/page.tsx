"use client";

import { useEffect, useMemo, useState } from "react";
import { ShieldCheck, TrendingDown, BarChart3, Factory, ClipboardList, Plus, Trash2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Chart } from "@/components/chart";
import { TiltPanel } from "@/components/tilt-panel";
import { PanelHeader } from "@/components/panel-header";
import { kalkulasiKpi, ambilTren, ambilPareto, ambilDefectPerLine } from "@/lib/kalkulator";
import { useRawRows } from "@/lib/store";
import { useDefects, muatDefects, tambahDefect, hapusDefect } from "@/lib/store-quality";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";

const LINES = ["AC SPLIT", "AC PORTABLE", "WASHING MACHINE", "AC COMERCIAL"];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}
const AXIS = {
  axisLine: { lineStyle: { color: "rgba(0,179,172,0.15)" } },
  axisLabel: { color: "rgba(147,245,238,0.55)", fontSize: 10 },
  splitLine: { lineStyle: { color: "rgba(0,179,172,0.06)" } },
};
const TOOLTIP = {
  backgroundColor: "rgba(3,9,13,0.95)",
  borderColor: "rgba(0,179,172,0.35)",
  textStyle: { color: "#d3faf6" },
};

export default function QualityPage() {
  const { t } = useI18n();
  const rows = useRawRows();
  const defects = useDefects();
  const [role, setRole] = useState<string | null>(null);
  const [form, setForm] = useState({ date: todayIso(), line: LINES[0], model: "", defect_type: "", qty: 1 });
  const [status, setStatus] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    muatDefects();
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => setRole(d.user?.role ?? null))
      .catch(() => setRole(null));
  }, []);

  const isViewer = role === "viewer";

  const set = (key: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [key]: key === "qty" ? Number(value) : value }));
  };

  const valid = useMemo(
    () => form.date && form.line && form.model.trim().length > 0 && form.defect_type.trim().length > 0 && form.qty >= 1,
    [form]
  );

  const simpan = async () => {
    if (!valid) {
      setStatus({ type: "err", msg: t("quality.input.required") });
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      await tambahDefect({ date: form.date, line: form.line, model: form.model.trim(), defect_type: form.defect_type.trim(), qty: form.qty });
      setForm((f) => ({ ...f, model: "", defect_type: "", qty: 1 }));
      setStatus({ type: "ok", msg: t("quality.input.saved") });
    } catch (e) {
      setStatus({ type: "err", msg: t("quality.input.error", { error: (e as Error).message }) });
    } finally {
      setSaving(false);
    }
  };

  const hapus = async (id: number) => {
    try {
      await hapusDefect(id);
    } catch (e) {
      setStatus({ type: "err", msg: t("quality.input.deleteError", { error: (e as Error).message }) });
    }
  };

  const inputCls =
    "w-full rounded-xl border border-hisense/15 bg-obsidian-900/80 px-3.5 py-2.5 text-sm text-hisense-soft outline-none transition-all placeholder:text-hisense-soft/30 focus:border-hisense/60 focus:shadow-[0_0_20px_rgba(0,179,172,0.15)]";

  const sorted = useMemo(
    () => [...defects].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id),
    [defects]
  );
  const totalQty = useMemo(() => defects.reduce((s, d) => s + d.qty, 0), [defects]);

  const kpi = useMemo(() => kalkulasiKpi(rows), [rows]);
  const tren = useMemo(() => ambilTren(rows), [rows]);
  const pareto = useMemo(() => ambilPareto(rows), [rows]);
  const defectPerLine = useMemo(() => ambilDefectPerLine(rows), [rows]);
  const dates = tren.map((t) => t.date);

  const fpyDaily = useMemo(() => {
    const map = new Map<string, { good: number[]; defect: number[] }>();
    for (const r of rows) {
      const e = map.get(r.date.slice(5)) ?? { good: [], defect: [] };
      e.good.push(r.firstPassGoodQty);
      e.defect.push(r.defectQty);
      map.set(r.date.slice(5), e);
    }
    const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
    return [...map.values()].map((e) => {
      const input = sum(e.good) + sum(e.defect);
      return +((sum(e.good) / input) * 100).toFixed(1);
    });
  }, [rows]);

  const defectRateDaily = useMemo(() => {
    const map = new Map<string, { good: number[]; defect: number[] }>();
    for (const r of rows) {
      const e = map.get(r.date.slice(5)) ?? { good: [], defect: [] };
      e.good.push(r.firstPassGoodQty);
      e.defect.push(r.defectQty);
      map.set(r.date.slice(5), e);
    }
    const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
    return [...map.values()].map((e) => {
      const input = sum(e.good) + sum(e.defect);
      return +((sum(e.defect) / input) * 100).toFixed(2);
    });
  }, [rows]);

  const fpyOption = {
    tooltip: { ...TOOLTIP, trigger: "axis" },
    grid: { top: 24, left: 44, right: 16, bottom: 28 },
    xAxis: { type: "category", data: dates, ...AXIS },
    yAxis: { ...AXIS, min: 90, max: 100, axisLabel: { ...AXIS.axisLabel, formatter: "{value}%" } },
    series: [
      {
        type: "line",
        smooth: true,
        symbol: "none",
        data: fpyDaily,
        lineStyle: { width: 3, color: "#22d3ee" },
        areaStyle: {
          color: {
            type: "linear", x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(34,211,238,0.35)" },
              { offset: 1, color: "rgba(34,211,238,0)" },
            ],
          },
        },
        markLine: {
          symbol: "none",
          lineStyle: { color: "#f59e0b", type: "dashed" },
          data: [{ yAxis: 98, label: { color: "#e9d5a0", formatter: t("quality.series.targetFpy") } }],
        },
      },
    ],
  };

  const defectRateOption = {
    tooltip: { ...TOOLTIP, trigger: "axis" },
    grid: { top: 24, left: 44, right: 16, bottom: 28 },
    xAxis: { type: "category", data: dates, ...AXIS },
    yAxis: { type: "value", ...AXIS, axisLabel: { ...AXIS.axisLabel, formatter: "{value}%" } },
    series: [
      {
        type: "bar",
        data: defectRateDaily,
        barWidth: 12,
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: {
            type: "linear", x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "#ef4444" },
              { offset: 1, color: "#7f1d1d" },
            ],
          },
        },
      },
    ],
  };

  const paretoOption = {
    tooltip: { ...TOOLTIP, trigger: "axis" },
    grid: { top: 24, left: 44, right: 44, bottom: 28 },
    xAxis: { type: "category", data: pareto.map((p) => p.model), ...AXIS },
    yAxis: [
      { type: "value", ...AXIS },
      { type: "value", max: 100, ...AXIS, axisLabel: { ...AXIS.axisLabel, formatter: "{value}%" } },
    ],
    series: [
      {
        name: t("quality.series.cacat"),
        type: "bar",
        data: pareto.map((p) => p.defects),
        barWidth: 34,
        itemStyle: {
          borderRadius: [8, 8, 0, 0],
          color: {
            type: "linear", x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "#a78bfa" },
              { offset: 1, color: "#5b21b6" },
            ],
          },
        },
      },
      {
        name: t("series.kumulatif"),
        type: "line",
        yAxisIndex: 1,
        data: pareto.map((p) => +p.cumulativePct.toFixed(1)),
        symbol: "circle",
        symbolSize: 7,
        lineStyle: { width: 2, color: "#f59e0b" },
        itemStyle: { color: "#f59e0b", borderColor: "#03090d", borderWidth: 1 },
      },
    ],
  };

  const perLineOption = {
    tooltip: { ...TOOLTIP },
    grid: { top: 20, left: 44, right: 24, bottom: 28 },
    xAxis: { type: "category", data: defectPerLine.map((d) => d.line), ...AXIS, axisTick: { show: false } },
    yAxis: { type: "value", ...AXIS },
    series: [
      {
        type: "bar",
        data: defectPerLine.map((d, i) => ({
          value: d.defects,
          itemStyle: { color: ["#22d3ee", "#a78bfa", "#fbbf24", "#fb7185"][i] },
        })),
        barWidth: 44,
        label: { show: true, position: "top", color: "#d3faf6", fontSize: 12 },
        itemStyle: { borderRadius: [10, 10, 0, 0] },
      },
    ],
  };

  return (
    <div className="space-y-6">
      <header className="anim-fade-up">
        <p className="lux-eyebrow">{t("quality.pilar")}</p>
        <h1 className="font-display text-hisense-gradient text-shadow-luxe mt-2 text-4xl font-bold lg:text-5xl">{t("quality.title")}</h1>
        <p className="mt-1.5 text-sm text-hisense-soft/75">{t("quality.subtitle")}</p>
      </header>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <TiltPanel className="gold-hairline anim-fade-up p-5" intensity={6}>
          <div className="flex items-center gap-2 text-hisense-soft/80">
            <ShieldCheck className="h-4 w-4 text-hisense" />
            <p className="text-sm font-semibold uppercase tracking-[0.15em]">{t("kpi.fpy")}</p>
          </div>
          <p
            className="font-display mt-3 text-5xl font-semibold lg:text-6xl leading-none tracking-tight text-glow"
            style={{ color: "#22d3ee", textShadow: "0 0 24px #22d3ee55, 0 0 64px #22d3ee22" }}
          >
            {kpi.fpy.toFixed(1)}%
          </p>
          <p className="mt-1.5 text-sm text-hisense-soft/65">{t("quality.kpi.fpyFormula")}</p>
        </TiltPanel>
        <TiltPanel className="anim-fade-up p-5" intensity={6}>
          <div className="flex items-center gap-2 text-hisense-soft/80">
            <TrendingDown className="h-4 w-4 text-red-400" />
            <p className="text-sm font-semibold uppercase tracking-[0.15em]">{t("quality.kpi.defectRate")}</p>
          </div>
          <p
            className="font-display mt-3 text-5xl font-semibold lg:text-6xl leading-none tracking-tight text-glow"
            style={{ color: "#fb7185", textShadow: "0 0 24px #fb718555, 0 0 64px #fb718522" }}
          >
            {kpi.defectRate.toFixed(2)}%
          </p>
          <p className="mt-1.5 text-sm text-hisense-soft/65">{t("quality.kpi.defectFormula")}</p>
        </TiltPanel>
        <TiltPanel className="anim-fade-up p-5" intensity={6}>
          <div className="flex items-center gap-2 text-hisense-soft/80">
            <BarChart3 className="h-4 w-4 text-hisense" />
            <p className="text-sm font-semibold uppercase tracking-[0.15em]">{t("quality.kpi.topDefect")}</p>
          </div>
          <p
            className="font-display mt-3 text-5xl font-semibold lg:text-6xl leading-none tracking-tight text-glow"
            style={{ color: "#a78bfa", textShadow: "0 0 24px #a78bfa55, 0 0 64px #a78bfa22" }}
          >
            {pareto[0]?.model}
          </p>
          <p className="mt-1.5 text-sm text-hisense-soft/65">{t("quality.kpi.topDefectSub", { n: pareto[0]?.defects ?? 0, p: pareto[0]?.cumulativePct.toFixed(0) ?? 0 })}</p>
        </TiltPanel>
      </div>

      <div className={cn("grid grid-cols-1 gap-6", isViewer ? "xl:grid-cols-1" : "xl:grid-cols-3")}>
        {!isViewer && (
        <TiltPanel className="anim-fade-up" intensity={3}>
          <PanelHeader icon={<Plus className="h-4 w-4" />} title={t("quality.input.title")} subtitle={t("quality.input.subtitle")} />
          <div className="space-y-4 p-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-hisense-soft/80">{t("quality.input.date")}</label>
                <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-hisense-soft/80">{t("quality.input.line")}</label>
                <select value={form.line} onChange={(e) => set("line", e.target.value)} className={cn(inputCls, "appearance-none")}>
                  {LINES.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-hisense-soft/80">{t("quality.input.model")}</label>
              <input type="text" value={form.model} onChange={(e) => set("model", e.target.value)} placeholder={t("quality.input.modelPlaceholder")} className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-hisense-soft/80">{t("quality.input.defectType")}</label>
              <input type="text" value={form.defect_type} onChange={(e) => set("defect_type", e.target.value)} placeholder={t("quality.input.defectTypePlaceholder")} className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-hisense-soft/80">{t("quality.input.qty")}</label>
              <input type="number" min={1} value={form.qty} onChange={(e) => set("qty", e.target.value)} className={inputCls} />
            </div>
            {status && (
              <div
                className={cn(
                  "flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm",
                  status.type === "ok"
                    ? "border-hisense/30 bg-hisense/10 text-hisense-soft"
                    : "border-gold-400/30 bg-gold-400/10 text-gold-300"
                )}
              >
                {status.type === "ok" ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-hisense" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
                )}
                {status.msg}
              </div>
            )}
            <button
              onClick={simpan}
              disabled={saving}
              className="group shine-sweep relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-hisense-bold via-hisense to-hisense-soft px-6 py-3 text-sm font-bold text-obsidian-950 shadow-hisense-glow/30 transition-all hover:shadow-hisense-glow/50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-4 w-4 transition-transform group-hover:scale-110" />
              {saving ? t("quality.input.saving") : t("quality.input.save")}
            </button>
          </div>
        </TiltPanel>
        )}

        <TiltPanel className={cn("anim-fade-up", isViewer ? "" : "xl:col-span-2")} intensity={3}>
          <PanelHeader
            icon={<ClipboardList className="h-4 w-4" />}
            title={t("quality.table.title")}
            subtitle={t("quality.table.subtitle")}
            right={<span className="text-xs text-hisense-soft/80">{t("quality.table.total", { n: totalQty })}</span>}
          />
          <div className="overflow-x-auto px-5 pb-5 pt-4">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-hisense/15 text-[11px] uppercase tracking-wider text-hisense-soft/75">
                  <th className="pb-3 pr-4 font-semibold">{t("quality.table.date")}</th>
                  <th className="pb-3 pr-4 font-semibold">{t("quality.table.line")}</th>
                  <th className="pb-3 pr-4 font-semibold">{t("quality.table.model")}</th>
                  <th className="pb-3 pr-4 font-semibold">{t("quality.table.defectType")}</th>
                  <th className="pb-3 pr-4 font-semibold">{t("quality.table.qty")}</th>
                  {!isViewer && <th className="pb-3 font-semibold">{t("quality.table.action")}</th>}
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={isViewer ? 5 : 6} className="py-10 text-center text-sm text-hisense-soft/40">{t("quality.table.empty")}</td>
                  </tr>
                ) : (
                  sorted.map((d) => (
                    <tr key={d.id} className="border-b border-hisense/8 transition-colors hover:bg-hisense/5">
                      <td className="py-3 pr-4 font-mono text-xs text-hisense-soft/80">{d.date}</td>
                      <td className="py-3 pr-4 text-hisense-soft/70">{d.line}</td>
                      <td className="py-3 pr-4 text-hisense-soft">{d.model}</td>
                      <td className="py-3 pr-4 text-hisense-soft/70">{d.defect_type}</td>
                      <td className="py-3 pr-4 font-mono text-xs text-hisense-soft">{d.qty}</td>
                      {!isViewer && (
                        <td className="py-3">
                          <button
                            onClick={() => hapus(d.id)}
                            title={t("quality.table.action")}
                            className="rounded-lg border border-red-500/25 bg-red-500/10 p-1.5 text-red-300 transition-all hover:border-red-500/50 hover:bg-red-500/20"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TiltPanel>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <TiltPanel className="anim-fade-up" intensity={3}>
          <PanelHeader icon={<ShieldCheck className="h-4 w-4" />} title={t("quality.chart.fpyDaily")} subtitle={t("quality.chart.fpyDailySub")} />
          <Chart option={fpyOption} height={280} className="px-2 pb-2" />
        </TiltPanel>
        <TiltPanel className="anim-fade-up" intensity={3}>
          <PanelHeader icon={<TrendingDown className="h-4 w-4" />} title={t("quality.chart.defectRate")} subtitle={t("quality.chart.defectRateSub")} />
          <Chart option={defectRateOption} height={280} className="px-2 pb-2" />
        </TiltPanel>
        <TiltPanel className="anim-fade-up" intensity={3}>
          <PanelHeader icon={<BarChart3 className="h-4 w-4" />} title={t("quality.chart.pareto")} subtitle={t("chart.defectParetoSub")} />
          <Chart option={paretoOption} height={280} className="px-2 pb-2" />
        </TiltPanel>
        <TiltPanel className="anim-fade-up" intensity={3}>
          <PanelHeader icon={<Factory className="h-4 w-4" />} title={t("quality.chart.perLine")} subtitle={t("quality.chart.perLineSub")} />
          <Chart option={perLineOption} height={280} className="px-2 pb-2" />
        </TiltPanel>
      </div>
    </div>
  );
}
