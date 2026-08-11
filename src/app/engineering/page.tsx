"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  CircleDot,
  Clock,
  Trash2,
  Save,
  Plus,
  RefreshCw,
} from "lucide-react";
import { Chart } from "@/components/chart";
import { TiltPanel } from "@/components/tilt-panel";
import { PanelHeader } from "@/components/panel-header";
import { kalkulasiKpi } from "@/lib/kalkulator";
import { useRawRows } from "@/lib/store";
import {
  useEngineering,
  muatEngineering,
  tambahIssue,
  ubahStatusIssue,
  hapusIssue,
  tambahTool,
  hapusTool,
  tambahImprovement,
  hapusImprovement,
  type IssueItem,
  type ToolItem,
  type ImprovementItem,
} from "@/lib/store-engineering";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";

const LINES = ["AC SPLIT", "AC PORTABLE", "WASHING MACHINE", "AC COMERCIAL"];
const PRIORITIES = ["high", "medium", "low"] as const;
const STATUSES = ["open", "progress", "closed"] as const;
const NEXT_STATUS: Record<(typeof STATUSES)[number], (typeof STATUSES)[number]> = {
  open: "progress",
  progress: "closed",
  closed: "open",
};

const TOOLTIP = {
  backgroundColor: "rgba(3,9,13,0.95)",
  borderColor: "rgba(0,179,172,0.35)",
  textStyle: { color: "#d3faf6" },
};

const STATUS_STYLE: Record<string, { labelKey: string; cls: string; dot: string }> = {
  open: { labelKey: "engineering.status.open", cls: "border-red-500/30 bg-red-500/10 text-red-300", dot: "bg-red-400" },
  progress: { labelKey: "engineering.status.progress", cls: "border-gold-400/30 bg-gold-400/10 text-gold-300", dot: "bg-gold-400" },
  closed: { labelKey: "engineering.status.closed", cls: "border-hisense/30 bg-hisense/10 text-hisense-soft", dot: "bg-hisense" },
};

const PRIORITY_KEY: Record<string, string> = {
  high: "engineering.priority.high",
  medium: "engineering.priority.medium",
  low: "engineering.priority.low",
};

const inputCls =
  "w-full rounded-xl border border-hisense/15 bg-obsidian-900/80 px-3.5 py-2.5 text-sm text-hisense-soft outline-none transition-all placeholder:text-hisense-soft/30 focus:border-hisense/60 focus:shadow-[0_0_20px_rgba(0,179,172,0.15)]";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function StatusBox({ status }: { status: { type: "ok" | "err"; msg: string } | null }) {
  if (!status) return null;
  return (
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
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-hisense-soft/60">
        {label}
      </label>
      {children}
    </div>
  );
}

type FormStatus = { type: "ok" | "err"; msg: string } | null;
type Tab = "issue" | "tool" | "improvement";

export default function EngineeringPage() {
  const { t } = useI18n();
  const rows = useRawRows();
  const data = useEngineering();
  const kpi = useMemo(() => kalkulasiKpi(rows), [rows]);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    void muatEngineering();
  }, []);

  const [tab, setTab] = useState<Tab>("issue");
  const [issueForm, setIssueForm] = useState({
    title: "",
    line: LINES[0],
    owner: "",
    priority: "medium" as (typeof PRIORITIES)[number],
    status: "open" as (typeof STATUSES)[number],
    due_date: todayIso(),
  });
  const [toolForm, setToolForm] = useState({ name: "", planned_hours: "", actual_available_hours: "" });
  const [impForm, setImpForm] = useState({ title: "", baseline: "", after: "", unit: "" });
  const [issueStatus, setIssueStatus] = useState<FormStatus>(null);
  const [toolStatus, setToolStatus] = useState<FormStatus>(null);
  const [impStatus, setImpStatus] = useState<FormStatus>(null);
  const [issueSaving, setIssueSaving] = useState(false);
  const [toolSaving, setToolSaving] = useState(false);
  const [impSaving, setImpSaving] = useState(false);
  const [issueErr, setIssueErr] = useState<string | null>(null);
  const [toolErr, setToolErr] = useState<string | null>(null);
  const [impErr, setImpErr] = useState<string | null>(null);

  const counts = useMemo(
    () => ({
      open: data.issues.filter((i) => i.status === "open").length,
      progress: data.issues.filter((i) => i.status === "progress").length,
      closed: data.issues.filter((i) => i.status === "closed").length,
      overdue: data.issues.filter((i) => i.status !== "closed" && i.dueDate < today).length,
    }),
    [data.issues, today]
  );

  const numOk = (v: string) => v.trim() !== "" && Number(v) >= 0;
  const issueValid = !!issueForm.title.trim() && !!issueForm.owner.trim() && !!issueForm.due_date;
  const toolValid = !!toolForm.name.trim() && numOk(toolForm.planned_hours) && numOk(toolForm.actual_available_hours);
  const impValid = !!impForm.title.trim() && numOk(impForm.baseline) && numOk(impForm.after) && !!impForm.unit.trim();

  const simpanIssue = async () => {
    setIssueSaving(true);
    setIssueStatus(null);
    try {
      await tambahIssue({
        title: issueForm.title,
        line: issueForm.line,
        owner: issueForm.owner,
        priority: issueForm.priority,
        status: issueForm.status,
        dueDate: issueForm.due_date,
      });
      setIssueStatus({ type: "ok", msg: t("engineering.form.savedOk") });
      setIssueForm({ title: "", line: LINES[0], owner: "", priority: "medium", status: "open", due_date: todayIso() });
    } catch (e) {
      setIssueStatus({ type: "err", msg: t("engineering.form.saveError", { error: (e as Error).message }) });
    } finally {
      setIssueSaving(false);
    }
  };

  const simpanTool = async () => {
    setToolSaving(true);
    setToolStatus(null);
    try {
      await tambahTool({
        name: toolForm.name,
        plannedHours: Number(toolForm.planned_hours),
        actualAvailableHours: Number(toolForm.actual_available_hours),
      });
      setToolStatus({ type: "ok", msg: t("engineering.form.savedOk") });
      setToolForm({ name: "", planned_hours: "", actual_available_hours: "" });
    } catch (e) {
      setToolStatus({ type: "err", msg: t("engineering.form.saveError", { error: (e as Error).message }) });
    } finally {
      setToolSaving(false);
    }
  };

  const simpanImprovement = async () => {
    setImpSaving(true);
    setImpStatus(null);
    try {
      await tambahImprovement({
        title: impForm.title,
        baseline: Number(impForm.baseline),
        after: Number(impForm.after),
        unit: impForm.unit,
      });
      setImpStatus({ type: "ok", msg: t("engineering.form.savedOk") });
      setImpForm({ title: "", baseline: "", after: "", unit: "" });
    } catch (e) {
      setImpStatus({ type: "err", msg: t("engineering.form.saveError", { error: (e as Error).message }) });
    } finally {
      setImpSaving(false);
    }
  };

  const siklusStatus = async (issue: IssueItem) => {
    try {
      await ubahStatusIssue(issue.id, NEXT_STATUS[issue.status]);
      setIssueErr(null);
    } catch (e) {
      setIssueErr((e as Error).message);
    }
  };

  const hapusItem = async (id: number) => {
    try {
      await hapusIssue(id);
      setIssueErr(null);
    } catch (e) {
      setIssueErr((e as Error).message);
    }
  };

  const hapusToolItem = async (id: number) => {
    try {
      await hapusTool(id);
      setToolErr(null);
    } catch (e) {
      setToolErr((e as Error).message);
    }
  };

  const hapusImpItem = async (id: number) => {
    try {
      await hapusImprovement(id);
      setImpErr(null);
    } catch (e) {
      setImpErr((e as Error).message);
    }
  };

  const closureOption = {
    tooltip: { ...TOOLTIP },
    series: [
      {
        type: "pie",
        radius: ["50%", "75%"],
        center: ["50%", "50%"],
        itemStyle: { borderRadius: 8, borderColor: "#03090d", borderWidth: 3 },
        label: { color: "#d3faf6", fontSize: 11, formatter: "{b}\n{c}" },
        data: [
          { name: t("engineering.status.closed"), value: counts.closed, itemStyle: { color: "#34d399" } },
          { name: t("engineering.status.progress"), value: counts.progress, itemStyle: { color: "#f59e0b" } },
          { name: t("engineering.status.open"), value: counts.open, itemStyle: { color: "#ef4444" } },
        ],
      },
    ],
  };

  const toolOption = {
    tooltip: { ...TOOLTIP },
    grid: { top: 20, left: 44, right: 24, bottom: 60 },
    xAxis: {
      type: "category",
      data: data.tools.map((t) => t.name),
      axisLabel: { color: "rgba(147,245,238,0.55)", fontSize: 10, rotate: 22 },
      axisLine: { lineStyle: { color: "rgba(0,179,172,0.15)" } },
      axisTick: { show: false },
      splitLine: { show: false },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: "rgba(147,245,238,0.55)", fontSize: 10, formatter: (v: { value: number }) => `${v.value} ${t("common.unit.hr")}` },
      splitLine: { lineStyle: { color: "rgba(0,179,172,0.06)" } },
    },
    series: [
      {
        type: "bar",
        barWidth: 22,
        data: data.tools.map((tt) => ({
          value: tt.actualAvailableHours,
          itemStyle: {
            borderRadius: [6, 6, 0, 0],
            color: "#34d399",
          },
        })),
        label: {
          show: true,
          position: "top",
          color: "#d3faf6",
          fontSize: 10,
          formatter: (p: { value: number }) => `${((p.value / 120) * 100).toFixed(0)}%`,
        },
        markLine: {
          symbol: "none",
          lineStyle: { color: "#f59e0b", type: "dashed" },
          data: [{ yAxis: 100, label: { color: "#e9d5a0", formatter: () => t("engineering.chart.toolTarget", { n: 100 }) } }],
        },
      },
    ],
  };

  const improvementOption = {
    tooltip: {
      ...TOOLTIP,
      formatter: (p: { name: string; value: number; seriesName: string; data: { unit: string } }) =>
        `${p.seriesName}<br/><b>${p.name}</b><br/>${p.seriesName === t("engineering.chart.seriesAfter") ? "−" : ""}${p.value} ${p.data?.unit ?? ""}`,
    },
    grid: { top: 40, left: 44, right: 24, bottom: 70 },
    legend: {
      textStyle: { color: "rgba(147,245,238,0.7)", fontSize: 11 },
      top: 0,
      icon: "roundRect",
      itemWidth: 14,
      itemHeight: 6,
    },
    xAxis: {
      type: "category",
      data: data.improvements.map((i) => i.title),
      axisLabel: { color: "rgba(147,245,238,0.55)", fontSize: 9, rotate: 28 },
      axisLine: { lineStyle: { color: "rgba(0,179,172,0.15)" } },
      axisTick: { show: false },
      splitLine: { show: false },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: "rgba(147,245,238,0.55)", fontSize: 10 },
      splitLine: { lineStyle: { color: "rgba(0,179,172,0.06)" } },
    },
    series: [
      {
        name: t("engineering.chart.seriesBaseline"),
        type: "bar",
        data: data.improvements.map((i) => i.baseline),
        barWidth: 14,
        itemStyle: { borderRadius: [4, 4, 0, 0], color: "#22d3ee" },
      },
      {
        name: t("engineering.chart.seriesAfter"),
        type: "bar",
        data: data.improvements.map((i) => i.after),
        barWidth: 14,
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: {
            type: "linear", x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "#fbbf24" },
              { offset: 1, color: "#b45309" },
            ],
          },
        },
      },
    ],
  };

  const tabs: { key: Tab; label: string; icon: ReactNode }[] = [
    { key: "issue", label: t("engineering.form.tab.issue"), icon: <AlertTriangle className="h-3.5 w-3.5" /> },
    { key: "tool", label: t("engineering.form.tab.tool"), icon: <Wrench className="h-3.5 w-3.5" /> },
    { key: "improvement", label: t("engineering.form.tab.improvement"), icon: <TrendingUp className="h-3.5 w-3.5" /> },
  ];

  const saveBtn = (saving: boolean, onClick: () => void, valid: boolean) => (
    <button
      onClick={onClick}
      disabled={!valid || saving}
      className="group shine-sweep relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-hisense-bold via-hisense to-hisense-soft px-6 py-3.5 text-sm font-bold text-obsidian-950 shadow-hisense-glow/30 transition-all hover:shadow-hisense-glow/50 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Save className="h-4 w-4 transition-transform group-hover:scale-110" />
      {saving ? t("engineering.form.saving") : t("engineering.form.save")}
    </button>
  );

  const delBtn = (title: string, onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="rounded-lg border border-hisense/15 bg-obsidian-900/60 p-1.5 text-hisense-soft/60 transition-colors hover:border-red-500/40 hover:text-red-300"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );

  return (
    <div className="space-y-6">
      <header className="anim-fade-up">
        <p className="lux-eyebrow">{t("engineering.pillar")}</p>
        <h1 className="font-display text-hisense-gradient text-shadow-luxe mt-2 text-4xl font-bold lg:text-5xl">{t("engineering.title")}</h1>
        <p className="mt-1.5 text-sm text-hisense-soft/50">{t("engineering.subtitle")}</p>
      </header>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <TiltPanel className="gold-hairline anim-fade-up p-5" intensity={6}>
          <div className="flex items-center gap-2 text-hisense-soft/60">
            <CheckCircle2 className="h-4 w-4 text-hisense" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em]">{t("engineering.kpi.issueClosureRate")}</p>
          </div>
          <p
            className="font-display mt-3 text-5xl font-semibold lg:text-6xl leading-none tracking-tight text-glow"
            style={{ color: "#fb7185", textShadow: "0 0 24px #fb718555, 0 0 64px #fb718522" }}
          >
            {kpi.issueClosure.toFixed(0)}%
          </p>
          <p className="mt-1 text-xs text-hisense-soft/50">{t("engineering.kpi.issueClosureSub", { closed: counts.closed, total: data.issues.length })}</p>
        </TiltPanel>
        <TiltPanel className="anim-fade-up p-5" intensity={6}>
          <div className="flex items-center gap-2 text-hisense-soft/60">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em]">{t("engineering.kpi.overdueRate")}</p>
          </div>
          <p
            className="font-display mt-3 text-5xl font-semibold lg:text-6xl leading-none tracking-tight text-glow"
            style={{ color: "#f87171", textShadow: "0 0 24px #f8717155, 0 0 64px #f8717122" }}
          >
            {kpi.overdueRate.toFixed(0)}%
          </p>
          <p className="mt-1 text-xs text-hisense-soft/50">{t("engineering.kpi.overdueRateSub", { n: counts.overdue })}</p>
        </TiltPanel>
        <TiltPanel className="anim-fade-up p-5" intensity={6}>
          <div className="flex items-center gap-2 text-hisense-soft/60">
            <Wrench className="h-4 w-4 text-hisense" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em]">{t("engineering.kpi.toolAvailability")}</p>
          </div>
          <p
            className="font-display mt-3 text-5xl font-semibold lg:text-6xl leading-none tracking-tight text-glow"
            style={{ color: "#34d399", textShadow: "0 0 24px #34d39955, 0 0 64px #34d39922" }}
          >
            {kpi.toolAvailability.toFixed(0)}%
          </p>
          <p className="mt-1 text-xs text-hisense-soft/50">{t("engineering.kpi.toolAvailabilitySub")}</p>
        </TiltPanel>
        <TiltPanel className="anim-fade-up p-5" intensity={6}>
          <div className="flex items-center gap-2 text-hisense-soft/60">
            <TrendingUp className="h-4 w-4 text-hisense" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em]">{t("engineering.kpi.improvementEffectiveness")}</p>
          </div>
          <p className="lux-gold-text font-display mt-3 text-5xl font-bold lg:text-6xl text-glow">−{kpi.improvementEffectiveness.toFixed(0)}%</p>
          <p className="mt-1 text-xs text-hisense-soft/50">{t("engineering.kpi.improvementEffectivenessSub")}</p>
        </TiltPanel>
      </div>

      <TiltPanel className="anim-fade-up" intensity={3}>
        <PanelHeader icon={<Plus className="h-4 w-4" />} title={t("engineering.form.title")} subtitle={t("engineering.form.subtitle")} />
        <div className="flex gap-2 p-5 pb-0">
          {tabs.map((tb) => (
            <button
              key={tb.key}
              type="button"
              onClick={() => setTab(tb.key)}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-all",
                tab === tb.key
                  ? "border-hisense/60 bg-hisense/15 text-hisense-soft shadow-[0_0_16px_rgba(0,179,172,0.15)]"
                  : "border-hisense/10 bg-obsidian-900/60 text-hisense-soft/50 hover:border-hisense/30"
              )}
            >
              {tb.icon}
              {tb.label}
            </button>
          ))}
        </div>

        {tab === "issue" && (
          <div className="space-y-4 p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t("engineering.form.issueTitle")}>
                <input
                  type="text"
                  value={issueForm.title}
                  onChange={(e) => setIssueForm((f) => ({ ...f, title: e.target.value }))}
                  className={inputCls}
                />
              </Field>
              <Field label={t("engineering.form.line")}>
                <select
                  value={issueForm.line}
                  onChange={(e) => setIssueForm((f) => ({ ...f, line: e.target.value }))}
                  className={inputCls}
                >
                  {LINES.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </Field>
              <Field label={t("engineering.form.owner")}>
                <input
                  type="text"
                  value={issueForm.owner}
                  onChange={(e) => setIssueForm((f) => ({ ...f, owner: e.target.value }))}
                  className={inputCls}
                />
              </Field>
              <Field label={t("engineering.form.dueDate")}>
                <input
                  type="date"
                  value={issueForm.due_date}
                  onChange={(e) => setIssueForm((f) => ({ ...f, due_date: e.target.value }))}
                  className={inputCls}
                />
              </Field>
              <Field label={t("engineering.form.priority")}>
                <select
                  value={issueForm.priority}
                  onChange={(e) => setIssueForm((f) => ({ ...f, priority: e.target.value as (typeof PRIORITIES)[number] }))}
                  className={inputCls}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>{t(`engineering.priority.${p}`)}</option>
                  ))}
                </select>
              </Field>
              <Field label={t("engineering.form.status")}>
                <select
                  value={issueForm.status}
                  onChange={(e) => setIssueForm((f) => ({ ...f, status: e.target.value as (typeof STATUSES)[number] }))}
                  className={inputCls}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{t(`engineering.status.${s}`)}</option>
                  ))}
                </select>
              </Field>
            </div>
            <StatusBox status={issueStatus} />
            {saveBtn(issueSaving, simpanIssue, issueValid)}
          </div>
        )}

        {tab === "tool" && (
          <div className="space-y-4 p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label={t("engineering.form.toolName")}>
                <input
                  type="text"
                  value={toolForm.name}
                  onChange={(e) => setToolForm((f) => ({ ...f, name: e.target.value }))}
                  className={inputCls}
                />
              </Field>
              <Field label={t("engineering.form.plannedHours")}>
                <input
                  type="number"
                  min={0}
                  value={toolForm.planned_hours}
                  onChange={(e) => setToolForm((f) => ({ ...f, planned_hours: e.target.value }))}
                  className={inputCls}
                />
              </Field>
              <Field label={t("engineering.form.actualHours")}>
                <input
                  type="number"
                  min={0}
                  value={toolForm.actual_available_hours}
                  onChange={(e) => setToolForm((f) => ({ ...f, actual_available_hours: e.target.value }))}
                  className={inputCls}
                />
              </Field>
            </div>
            <StatusBox status={toolStatus} />
            {saveBtn(toolSaving, simpanTool, toolValid)}
          </div>
        )}

        {tab === "improvement" && (
          <div className="space-y-4 p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t("engineering.form.improvementTitle")}>
                <input
                  type="text"
                  value={impForm.title}
                  onChange={(e) => setImpForm((f) => ({ ...f, title: e.target.value }))}
                  className={inputCls}
                />
              </Field>
              <Field label={t("engineering.form.unit")}>
                <input
                  type="text"
                  value={impForm.unit}
                  onChange={(e) => setImpForm((f) => ({ ...f, unit: e.target.value }))}
                  className={inputCls}
                />
              </Field>
              <Field label={t("engineering.form.baseline")}>
                <input
                  type="number"
                  min={0}
                  value={impForm.baseline}
                  onChange={(e) => setImpForm((f) => ({ ...f, baseline: e.target.value }))}
                  className={inputCls}
                />
              </Field>
              <Field label={t("engineering.form.after")}>
                <input
                  type="number"
                  min={0}
                  value={impForm.after}
                  onChange={(e) => setImpForm((f) => ({ ...f, after: e.target.value }))}
                  className={inputCls}
                />
              </Field>
            </div>
            <StatusBox status={impStatus} />
            {saveBtn(impSaving, simpanImprovement, impValid)}
          </div>
        )}
      </TiltPanel>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <TiltPanel className="anim-fade-up xl:col-span-1" intensity={3}>
          <PanelHeader icon={<CircleDot className="h-4 w-4" />} title={t("engineering.panel.closure.title")} subtitle={t("engineering.panel.closure.subtitle")} />
          <Chart option={closureOption} height={260} className="px-2 pb-2" />
        </TiltPanel>
        <TiltPanel className="anim-fade-up xl:col-span-2" intensity={3}>
          <PanelHeader icon={<Wrench className="h-4 w-4" />} title={t("engineering.panel.availability.title")} subtitle={t("engineering.panel.availability.subtitle")} />
          <Chart option={toolOption} height={260} className="px-2 pb-2" />
        </TiltPanel>
        <TiltPanel className="anim-fade-up xl:col-span-3" intensity={3}>
          <PanelHeader icon={<TrendingUp className="h-4 w-4" />} title={t("engineering.kpi.improvementEffectiveness")} subtitle={t("engineering.panel.improvement.subtitle")} />
          <Chart option={improvementOption} height={280} className="px-2 pb-2" />
        </TiltPanel>
      </div>

      <TiltPanel className="anim-fade-up" intensity={2}>
        <PanelHeader icon={<Wrench className="h-4 w-4" />} title={t("engineering.panel.list.title")} subtitle={t("engineering.panel.list.subtitle")} />
        {issueErr && (
          <div className="mx-5 mt-4 flex items-center gap-2 rounded-xl border border-gold-400/30 bg-gold-400/10 px-4 py-2.5 text-xs text-gold-300">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-gold-400" />
            {t("engineering.action.error", { error: issueErr })}
          </div>
        )}
        <div className="overflow-x-auto px-5 pb-5 pt-4">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-hisense/15 text-[11px] uppercase tracking-wider text-hisense-soft/50">
                <th className="pb-3 pr-4 font-semibold">ID</th>
                <th className="pb-3 pr-4 font-semibold">{t("engineering.table.desc")}</th>
                <th className="pb-3 pr-4 font-semibold">{t("engineering.table.line")}</th>
                <th className="pb-3 pr-4 font-semibold">PIC</th>
                <th className="pb-3 pr-4 font-semibold">{t("engineering.table.priority")}</th>
                <th className="pb-3 pr-4 font-semibold">{t("engineering.table.dueDate")}</th>
                <th className="pb-3 pr-4 font-semibold">{t("engineering.table.status")}</th>
                <th className="pb-3 font-semibold">{t("engineering.table.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {data.issues.map((issue) => {
                const overdue = issue.status !== "closed" && issue.dueDate < today;
                const st = STATUS_STYLE[issue.status];
                return (
                  <tr key={issue.id} className="border-b border-hisense/8 transition-colors hover:bg-hisense/5">
                    <td className="py-3 pr-4 font-mono text-xs text-hisense-soft/80">{issue.engId}</td>
                    <td className="py-3 pr-4 text-hisense-soft">
                      <span className="flex items-center gap-2">
                        {issue.title}
                        {overdue && (
                          <span className="flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] text-red-300">
                            <Clock className="h-3 w-3" /> {t("engineering.status.overdue")}
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-hisense-soft/70">{issue.line}</td>
                    <td className="py-3 pr-4 text-hisense-soft/70">{issue.owner}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={cn(
                          "rounded-full border px-2.5 py-0.5 text-[11px] capitalize",
                          issue.priority === "high" && "border-red-500/30 bg-red-500/10 text-red-300",
                          issue.priority === "medium" && "border-gold-400/30 bg-gold-400/10 text-gold-300",
                          issue.priority === "low" && "border-hisense/30 bg-hisense/10 text-hisense-soft"
                        )}
                      >
                        {t(PRIORITY_KEY[issue.priority])}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs text-hisense-soft/60">{issue.dueDate}</td>
                    <td className="py-3 pr-4">
                      <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px]", st.cls)}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", st.dot)} />
                        {overdue && issue.status !== "closed" ? t("engineering.status.overdue") : t(st.labelKey)}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => siklusStatus(issue)}
                          title={t("engineering.action.cycleStatus")}
                          className="rounded-lg border border-hisense/15 bg-obsidian-900/60 p-1.5 text-hisense-soft/60 transition-colors hover:border-hisense/40 hover:text-hisense-soft"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                        {delBtn(t("engineering.action.delete"), () => hapusItem(issue.id))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </TiltPanel>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <TiltPanel className="anim-fade-up" intensity={2}>
          <PanelHeader icon={<Wrench className="h-4 w-4" />} title={t("engineering.panel.toolsList.title")} subtitle={t("engineering.panel.toolsList.subtitle")} />
          {toolErr && (
            <div className="mx-5 mt-4 flex items-center gap-2 rounded-xl border border-gold-400/30 bg-gold-400/10 px-4 py-2.5 text-xs text-gold-300">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-gold-400" />
              {t("engineering.action.error", { error: toolErr })}
            </div>
          )}
          <ul className="px-5 pb-5 pt-4">
            {data.tools.map((tool: ToolItem) => (
              <li key={tool.id} className="flex items-center justify-between gap-3 border-b border-hisense/8 py-3 last:border-0">
                <span className="text-sm text-hisense-soft">{tool.name}</span>
                <span className="flex items-center gap-3">
                  <span className="font-mono text-xs text-hisense-soft/60">
                    {tool.plannedHours} → {tool.actualAvailableHours} {t("common.unit.hr")}
                  </span>
                  {delBtn(t("engineering.action.delete"), () => hapusToolItem(tool.id))}
                </span>
              </li>
            ))}
          </ul>
        </TiltPanel>

        <TiltPanel className="anim-fade-up" intensity={2}>
          <PanelHeader icon={<TrendingUp className="h-4 w-4" />} title={t("engineering.panel.impList.title")} subtitle={t("engineering.panel.impList.subtitle")} />
          {impErr && (
            <div className="mx-5 mt-4 flex items-center gap-2 rounded-xl border border-gold-400/30 bg-gold-400/10 px-4 py-2.5 text-xs text-gold-300">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-gold-400" />
              {t("engineering.action.error", { error: impErr })}
            </div>
          )}
          <ul className="px-5 pb-5 pt-4">
            {data.improvements.map((imp: ImprovementItem) => (
              <li key={imp.id} className="flex items-center justify-between gap-3 border-b border-hisense/8 py-3 last:border-0">
                <span className="text-sm text-hisense-soft">{imp.title}</span>
                <span className="flex items-center gap-3">
                  <span className="font-mono text-xs text-hisense-soft/60">
                    {imp.baseline} → {imp.after} {imp.unit}
                  </span>
                  {delBtn(t("engineering.action.delete"), () => hapusImpItem(imp.id))}
                </span>
              </li>
            ))}
          </ul>
        </TiltPanel>
      </div>
    </div>
  );
}
