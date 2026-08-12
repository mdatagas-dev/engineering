"use client";

import { useMemo, useState } from "react";
import { Database, Save, CheckCircle2, AlertTriangle, RotateCcw, Pencil, X } from "lucide-react";
import { TiltPanel } from "@/components/tilt-panel";
import { PanelHeader } from "@/components/panel-header";
import { useRawRows, simpanBaris, muatDariBackend } from "@/lib/store";
import { useEngineering } from "@/lib/store-engineering";
import { kalkulasiKpi } from "@/lib/kalkulator";
import { postRawData, resetRawData, type RawDataRow } from "@/lib/api";
import type { DailyRaw } from "@/lib/data";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";

const LINES = ["IDU", "ODU", "LINE 1"];
const CATEGORIES = ["AC SPLIT", "AC PORTABLE", "WASHING MACHINE", "AC COMERCIAL"];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

const initial = (): RawDataRow => ({
  date: todayIso(),
  model: "",
  line: "IDU",
  category: "AC SPLIT",
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

function toRow(r: DailyRaw): RawDataRow {
  return {
    date: r.date,
    model: r.model,
    line: r.line,
    category: r.category,
    input_qty: r.inputQty,
    first_pass_good_qty: r.firstPassGoodQty,
    defect_qty: r.defectQty,
    planned_minutes: r.plannedMinutes,
    downtime_minutes: r.downtimeMinutes,
    target_ct_sec: r.targetCtSec,
    actual_ct_sec: r.actualCtSec,
    standard_setup_min: r.standardSetupMin,
    actual_setup_min: r.actualSetupMin,
  };
}

export default function InputPage() {
  const { t, formatDate } = useI18n();
  const rows = useRawRows();
  const eng = useEngineering();
  const kpi = useMemo(() => kalkulasiKpi(rows, eng), [rows, eng]);
  const [form, setForm] = useState<RawDataRow>(initial);
  const [status, setStatus] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  const existing = useMemo(() => {
    const seen = new Map<string, DailyRaw>();
    for (const r of rows) {
      const key = `${r.date}|${r.model}|${r.line}`;
      if (!seen.has(key)) seen.set(key, r);
    }
    return [...seen.values()].sort((a, b) => b.date.localeCompare(a.date) || a.line.localeCompare(b.line));
  }, [rows]);

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
      f.line &&
      f.category &&
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
    simpanBaris({
      date: form.date,
      model: form.model,
      line: form.line,
      category: form.category,
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
      await muatDariBackend();
      setStatus({
        type: "ok",
        msg: editing ? t("input.status.updated") : t("input.status.saved"),
      });
    } catch (e) {
      setStatus({
        type: "err",
        msg: t("input.status.backendError", { error: (e as Error).message }),
      });
    } finally {
      setSaving(false);
      setForm(initial());
      setEditing(null);
    }
  };

  const mulaiEdit = (r: DailyRaw) => {
    setForm(toRow(r));
    setEditing(`${r.date}|${r.model}|${r.line}`);
    setStatus(null);
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
      <label className="mb-1.5 block text-lg font-semibold uppercase tracking-wider text-hisense-soft/80">
        {label}
      </label>
      <input
        type="number"
        value={form[key] as number}
        onChange={(e) => set(key, e.target.value)}
        className="w-full rounded-xl border border-hisense/15 bg-obsidian-900/80 px-4 py-3.5 text-xl text-hisense-soft outline-none transition-all placeholder:text-hisense-soft/30 focus:border-hisense/60 focus:shadow-[0_0_20px_rgba(0,179,172,0.15)]"
      />
      {hint && <p className="mt-1 text-base text-hisense-soft/60">{hint}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      <header className="anim-fade-up flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="lux-eyebrow">{t("menu.input")}</p>
          <h1 className="font-display text-hisense-gradient text-shadow-luxe mt-2 text-4xl font-bold lg:text-5xl">{t("input.title")}</h1>
          <p className="mt-1.5 text-lg text-hisense-soft/80">
            {t("input.subtitle")}
          </p>
        </div>
        <button
          onClick={reset}
          className="flex items-center gap-2 rounded-xl border border-hisense/20 bg-obsidian-850/60 px-5 py-3 text-lg text-hisense-soft/90 transition-all hover:border-hisense/40 hover:text-hisense-soft"
        >
          <RotateCcw className="h-4 w-4" /> {t("input.resetSeed")}
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
            {editing && (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-gold-400/40 bg-gold-400/10 px-4 py-3">
                <p className="text-lg font-semibold text-gold-300">
                  {t("input.edit.sedang", {
                    date: form.date,
                    model: form.model,
                    line: form.line,
                  })}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(null);
                    setForm(initial());
                    setStatus(null);
                  }}
                  className="flex items-center gap-1.5 rounded-lg border border-gold-400/40 px-3 py-1.5 text-base text-gold-300 transition-colors hover:bg-gold-400/15"
                >
                  <X className="h-4 w-4" /> {t("input.edit.batal")}
                </button>
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-lg font-semibold uppercase tracking-wider text-hisense-soft/80">
                  {t("input.field.model")}
                </label>
                <input
                  type="text"
                  value={form.model}
                  onChange={(e) => set("model", e.target.value)}
                  placeholder={t("input.field.modelPlaceholder")}
                  className="w-full rounded-xl border border-hisense/15 bg-obsidian-900/80 px-4 py-3.5 text-xl text-hisense-soft outline-none transition-all placeholder:text-hisense-soft/35 focus:border-hisense/60 focus:shadow-[0_0_20px_rgba(0,179,172,0.15)]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-lg font-semibold uppercase tracking-wider text-hisense-soft/80">
                  {t("input.field.date")}
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => set("date", e.target.value)}
                  className="w-full rounded-xl border border-hisense/15 bg-obsidian-900/80 px-4 py-3.5 text-xl text-hisense-soft outline-none transition-all focus:border-hisense/60 focus:shadow-[0_0_20px_rgba(0,179,172,0.15)]"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-lg font-semibold uppercase tracking-wider text-hisense-soft/80">
                {t("input.field.line")}
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {LINES.map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => set("line", o)}
                    className={cn(
                      "rounded-xl border px-3 py-3 text-base font-semibold uppercase tracking-wide transition-all",
                      form.line === o
                        ? "border-hisense/60 bg-hisense/15 text-hisense-soft shadow-[0_0_16px_rgba(0,179,172,0.15)]"
                        : "border-hisense/10 bg-obsidian-900/60 text-hisense-soft/60 hover:border-hisense/30"
                    )}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-lg font-semibold uppercase tracking-wider text-hisense-soft/80">
                {t("input.field.category")}
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {CATEGORIES.map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => set("category", o)}
                    className={cn(
                      "rounded-xl border px-3 py-3 text-base font-semibold uppercase tracking-wide transition-all",
                      form.category === o
                        ? "border-hisense/60 bg-hisense/15 text-hisense-soft shadow-[0_0_16px_rgba(0,179,172,0.15)]"
                        : "border-hisense/10 bg-obsidian-900/60 text-hisense-soft/60 hover:border-hisense/30"
                    )}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>

            <div className="lux-divider" />

            <p className="text-lg font-semibold uppercase tracking-[0.2em] text-gold-300/90">
              {t("input.section.prodQuality")}
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {numField(t("input.field.inputQty"), "input_qty", t("input.field.inputQtyHint"))}
              {numField(t("input.field.fpg"), "first_pass_good_qty", t("input.field.fpgHint"))}
              {numField(t("input.field.defectQty"), "defect_qty")}
            </div>

            <div className="lux-divider" />

            <p className="text-lg font-semibold uppercase tracking-[0.2em] text-gold-300/90">
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
                  "flex items-start gap-2.5 rounded-xl border px-4 py-3 text-lg",
                  status.type === "ok"
                    ? "border-hisense/30 bg-hisense/10 text-hisense-soft"
                    : "border-gold-400/30 bg-gold-400/10 text-gold-300"
                )}
              >
                {status.type === "ok" ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-hisense" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-gold-400" />
                )}
                {status.msg}
              </div>
            )}

            <button
              onClick={simpan}
              disabled={!valid || saving}
              className="group shine-sweep relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-hisense-bold via-hisense to-hisense-soft px-6 py-4 text-xl font-bold text-obsidian-950 shadow-hisense-glow/30 transition-all hover:shadow-hisense-glow/50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Save className="h-5 w-5 transition-transform group-hover:scale-110" />
              {saving ? t("input.button.saving") : t("input.button.save")}
            </button>
          </div>
        </TiltPanel>

        <div className="anim-fade-up space-y-6 xl:col-span-2">
          <TiltPanel className="gold-hairline p-5" intensity={5}>
            <p className="text-lg font-semibold uppercase tracking-[0.18em] text-hisense-soft/80">
              {t("input.kpi.latest")}
            </p>
            <div className="mt-4 space-y-3">
              {[
                { label: t("kpi.fpy"), value: `${kpi.fpy.toFixed(1)}%`, gold: false },
                { label: t("kpi.oee"), value: `${kpi.oee.toFixed(1)}%`, gold: false },
                { label: t("input.kpi.outputAchievement"), value: `${kpi.outputAchievement.toFixed(1)}%`, gold: false },
                { label: t("input.kpi.efficiencyDeviation"), value: `${kpi.efficiencyDeviation.toFixed(1)}%`, gold: true },
                { label: t("input.kpi.setupAchievement"), value: `${kpi.setupAchievement.toFixed(1)}%`, gold: true },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-3 glass-premium rounded-xl px-4 py-3.5">
                  <span className="text-lg text-hisense-soft/80">{item.label}</span>
                  <span className={cn("font-display text-3xl font-bold", item.gold ? "lux-gold-text" : "text-hisense-gradient")}>{item.value}</span>
                </div>
              ))}
            </div>
          </TiltPanel>

          <TiltPanel className="p-5" intensity={5}>
            <p className="text-lg font-semibold uppercase tracking-[0.18em] text-hisense-soft/80">
              {t("input.edit.title")}
            </p>
            <p className="mt-1 text-base text-hisense-soft/60">{t("input.edit.subtitle")}</p>
            <div className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
              {existing.length === 0 && (
                <p className="text-base text-hisense-soft/50">{t("input.edit.kosong")}</p>
              )}
              {existing.map((r) => {
                const key = `${r.date}|${r.model}|${r.line}`;
                return (
                  <div
                    key={key}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 transition-colors",
                      editing === key
                        ? "border-gold-400/50 bg-gold-400/10"
                        : "border-hisense/10 bg-obsidian-900/60 hover:border-hisense/30"
                    )}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-hisense-soft">{r.model}</p>
                      <p className="truncate text-sm text-hisense-soft/60">
                        {formatDate(r.date)} · {r.line}
                      </p>
                      {r.category && (
                        <span className="mt-0.5 inline-block rounded-md border border-hisense/20 px-1.5 py-0.5 text-[10px] uppercase text-hisense-soft/60">
                          {r.category}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => mulaiEdit(r)}
                      className="flex shrink-0 items-center gap-1.5 rounded-lg border border-hisense/25 px-3 py-1.5 text-sm text-hisense-soft transition-colors hover:border-hisense/50 hover:bg-hisense/10"
                    >
                      <Pencil className="h-3.5 w-3.5" /> {t("input.edit.button")}
                    </button>
                  </div>
                );
              })}
            </div>
          </TiltPanel>

          <TiltPanel className="p-5" intensity={5}>
            <p className="text-lg font-semibold uppercase tracking-[0.18em] text-hisense-soft/80">
              {t("input.calcFlow.title")}
            </p>
            <ol className="mt-4 space-y-3 text-lg text-hisense-soft/80">
              {[
                "input.calcFlow.step1",
                "input.calcFlow.step2",
                "input.calcFlow.step3",
                "input.calcFlow.step4",
                "input.calcFlow.step5",
                "input.calcFlow.step6",
              ].map((key, i) => (
                <li key={key} className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-hisense/25 bg-hisense/10 font-mono text-base text-hisense-soft">
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
