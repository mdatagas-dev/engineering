"use client";

import { useMemo, useState } from "react";
import { Database, Save, CheckCircle2, AlertTriangle, RotateCcw } from "lucide-react";
import { TiltPanel } from "@/components/tilt-panel";
import { PanelHeader } from "@/components/panel-header";
import { useRawRows, tambahBaris, muatDariBackend } from "@/lib/store";
import { kalkulasiKpi } from "@/lib/kalkulator";
import { postRawData, resetRawData, type RawDataRow } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";

const LINES = ["AC SPLIT", "AC PORTABLE", "WASHING MACHINE", "AC COMERCIAL"];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

const initial = (): RawDataRow => ({
  date: todayIso(),
  model: "",
  line: "AC SPLIT",
  input_qty: 200,
  first_pass_good_qty: 196,
  defect_qty: 3,
  planned_minutes: 450,
  downtime_minutes: 20,
  target_ct_sec: 60,
  actual_ct_sec: 63,
  standard_setup_min: 30,
  actual_setup_min: 35,
});

export default function InputPage() {
  const { t } = useI18n();
  const rows = useRawRows();
  const kpi = useMemo(() => kalkulasiKpi(rows), [rows]);
  const [form, setForm] = useState<RawDataRow>(initial);
  const [status, setStatus] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (key: keyof RawDataRow, value: string) => {
    const isNum = [
      "input_qty", "first_pass_good_qty", "defect_qty", "planned_minutes",
      "downtime_minutes", "target_ct_sec", "actual_ct_sec", "standard_setup_min",
      "actual_setup_min",
    ].includes(key);
    setForm((f) => ({ ...f, [key]: isNum ? Number(value) : value }));
  };

  const valid = useMemo(() => {
    const f = form;
    return (
      f.date &&
      f.model.trim().length > 0 &&
      f.input_qty > 0 &&
      f.first_pass_good_qty > 0 &&
      f.defect_qty >= 0 &&
      f.first_pass_good_qty + f.defect_qty <= f.input_qty &&
      f.planned_minutes > 0 &&
      f.downtime_minutes >= 0 &&
      f.target_ct_sec > 0 &&
      f.actual_ct_sec > 0 &&
      f.standard_setup_min > 0 &&
      f.actual_setup_min > 0
    );
  }, [form]);

  const simpan = async () => {
    setSaving(true);
    setStatus(null);
    tambahBaris({
      date: form.date,
      model: form.model,
      line: form.line,
      inputQty: form.input_qty,
      firstPassGoodQty: form.first_pass_good_qty,
      defectQty: form.defect_qty,
      plannedMinutes: form.planned_minutes,
      downtimeMinutes: form.downtime_minutes,
      targetCtSec: form.target_ct_sec,
      actualCtSec: form.actual_ct_sec,
      standardSetupMin: form.standard_setup_min,
      actualSetupMin: form.actual_setup_min,
    });
    try {
      await postRawData(form);
      setStatus({ type: "ok", msg: t("input.status.saved") });
    } catch (e) {
      setStatus({
        type: "err",
        msg: t("input.status.backendError", { error: (e as Error).message }),
      });
    } finally {
      setSaving(false);
      setForm(initial());
    }
  };

  const reset = async () => {
    try {
      await resetRawData();
      await muatDariBackend();
      setStatus({ type: "ok", msg: t("input.status.resetOk") });
    } catch (e) {
      setStatus({ type: "err", msg: t("input.status.resetError", { error: (e as Error).message }) });
    }
  };

  const numField = (label: string, key: keyof RawDataRow, hint?: string) => (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-hisense-soft/60">
        {label}
      </label>
      <input
        type="number"
        value={form[key] as number}
        onChange={(e) => set(key, e.target.value)}
        className="w-full rounded-xl border border-hisense/15 bg-obsidian-900/80 px-3.5 py-2.5 text-sm text-hisense-soft outline-none transition-all placeholder:text-hisense-soft/30 focus:border-hisense/60 focus:shadow-[0_0_20px_rgba(0,179,172,0.15)]"
      />
      {hint && <p className="mt-1 text-[10px] text-hisense-soft/35">{hint}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      <header className="anim-fade-up flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-hisense-soft/50">{t("menu.input")}</p>
          <h1 className="font-display text-hisense-gradient mt-2 text-3xl font-bold text-glow">{t("input.title")}</h1>
          <p className="mt-1.5 text-sm text-hisense-soft/50">
            {t("input.subtitle")}
          </p>
        </div>
        <button
          onClick={reset}
          className="flex items-center gap-2 rounded-xl border border-hisense/20 bg-obsidian-850/60 px-4 py-2.5 text-xs text-hisense-soft/70 transition-all hover:border-hisense/40 hover:text-hisense-soft"
        >
          <RotateCcw className="h-3.5 w-3.5" /> {t("input.resetSeed")}
        </button>
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <TiltPanel className="anim-fade-up xl:col-span-3" intensity={3}>
          <PanelHeader
            icon={<Database className="h-4 w-4" />}
            title={t("input.form.title")}
            subtitle={t("input.form.subtitle", { n: rows.length })}
          />
          <div className="space-y-5 p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-hisense-soft/60">
                  {t("input.field.model")}
                </label>
                <input
                  type="text"
                  value={form.model}
                  onChange={(e) => set("model", e.target.value)}
                  placeholder={t("input.field.modelPlaceholder")}
                  className="w-full rounded-xl border border-hisense/15 bg-obsidian-900/80 px-3.5 py-2.5 text-sm text-hisense-soft outline-none transition-all placeholder:text-hisense-soft/30 focus:border-hisense/60 focus:shadow-[0_0_20px_rgba(0,179,172,0.15)]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-hisense-soft/60">
                  {t("input.field.date")}
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => set("date", e.target.value)}
                  className="w-full rounded-xl border border-hisense/15 bg-obsidian-900/80 px-3.5 py-2.5 text-sm text-hisense-soft outline-none transition-all focus:border-hisense/60 focus:shadow-[0_0_20px_rgba(0,179,172,0.15)]"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-hisense-soft/60">
                {t("input.field.line")}
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {LINES.map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => set("line", o)}
                    className={cn(
                      "rounded-xl border px-3 py-2.5 text-xs font-semibold uppercase tracking-wide transition-all",
                      form.line === o
                        ? "border-hisense/60 bg-hisense/15 text-hisense-soft shadow-[0_0_16px_rgba(0,179,172,0.15)]"
                        : "border-hisense/10 bg-obsidian-900/60 text-hisense-soft/50 hover:border-hisense/30"
                    )}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>

            <div className="divider-glow" />

            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-300/70">
              {t("input.section.prodQuality")}
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {numField(t("input.field.inputQty"), "input_qty", t("input.field.inputQtyHint"))}
              {numField(t("input.field.fpg"), "first_pass_good_qty", t("input.field.fpgHint"))}
              {numField(t("input.field.defectQty"), "defect_qty")}
            </div>

            <div className="divider-glow" />

            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-300/70">
              {t("input.section.timeCycle")}
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {numField(t("input.field.plannedMinutes"), "planned_minutes")}
              {numField(t("input.field.downtimeMinutes"), "downtime_minutes")}
              {numField(t("input.field.targetCt"), "target_ct_sec")}
              {numField(t("input.field.actualCt"), "actual_ct_sec")}
              {numField(t("input.field.standardSetup"), "standard_setup_min")}
              {numField(t("input.field.actualSetup"), "actual_setup_min")}
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
              disabled={!valid || saving}
              className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-hisense-bold via-hisense to-hisense-soft px-6 py-3.5 text-sm font-bold text-obsidian-950 shadow-hisense-glow/30 transition-all hover:shadow-hisense-glow/50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Save className="h-4 w-4 transition-transform group-hover:scale-110" />
              {saving ? t("input.button.saving") : t("input.button.save")}
            </button>
          </div>
        </TiltPanel>

        <div className="anim-fade-up space-y-6 xl:col-span-2">
          <TiltPanel className="p-5" intensity={5}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-hisense-soft/50">
              {t("input.kpi.latest")}
            </p>
            <div className="mt-4 space-y-3">
              {[
                { label: t("kpi.fpy"), value: `${kpi.fpy.toFixed(1)}%` },
                { label: t("kpi.oee"), value: `${kpi.oee.toFixed(1)}%` },
                { label: t("kpi.lineBalance"), value: `${kpi.lineBalance.toFixed(1)}%` },
                { label: t("input.kpi.cycleTimeAchievement"), value: `${kpi.cycleTimeAchievement.toFixed(1)}%` },
                { label: t("input.kpi.setupAchievement"), value: `${kpi.setupAchievement.toFixed(1)}%` },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-3 glass-premium rounded-xl px-4 py-3">
                  <span className="text-xs text-hisense-soft/60">{item.label}</span>
                  <span className="text-hisense-gradient font-display text-lg font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </TiltPanel>

          <TiltPanel className="p-5" intensity={5}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-hisense-soft/50">
              {t("input.calcFlow.title")}
            </p>
            <ol className="mt-4 space-y-2.5 text-xs text-hisense-soft/60">
              {[
                "input.calcFlow.step1",
                "input.calcFlow.step2",
                "input.calcFlow.step3",
                "input.calcFlow.step4",
                "input.calcFlow.step5",
                "input.calcFlow.step6",
              ].map((key, i) => (
                <li key={key} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-hisense/25 bg-hisense/10 font-mono text-[10px] text-hisense-soft">
                    {i + 1}
                  </span>
                  {t(key)}
                </li>
              ))}
            </ol>
          </TiltPanel>
        </div>
      </div>
    </div>
  );
}
