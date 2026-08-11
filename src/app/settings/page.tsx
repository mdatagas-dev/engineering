"use client";

import { useEffect, useState } from "react";
import {
  UserCog,
  Languages,
  CalendarDays,
  Bell,
  LayoutGrid,
  Database,
  Server,
  Download,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  Eye,
  EyeOff,
  Wrench,
  HelpCircle,
  ShieldCheck,
  ChevronRight,
  Sun,
  Moon,
} from "lucide-react";
import Link from "next/link";
import { TiltPanel } from "@/components/tilt-panel";
import { PanelHeader } from "@/components/panel-header";
import { useI18n, type DateFormat } from "@/lib/i18n/provider";
import { LANGS, LANG_LABEL } from "@/lib/i18n/types";
import { useTheme } from "@/lib/theme";
import { useRawRows, gantiBaris } from "@/lib/store";
import { DAILY_RAW, type DailyRaw } from "@/lib/data";
import { resetRawData } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { t, lang, setLang, dateFormat, setDateFormat } = useI18n();
  const rows = useRawRows();

  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .catch(() => setUser(null));
    fetch("http://localhost:8101/health")
      .then((r) => r.ok)
      .then(setBackendOnline)
      .catch(() => setBackendOnline(false));
  }, []);

  return (
    <div className="space-y-6">
      <header className="anim-fade-up">
        <p className="lux-eyebrow mb-2">{t("menu.settings")}</p>
        <h1 className="font-display text-hisense-gradient text-4xl font-bold text-glow lg:text-5xl">{t("settings.title")}</h1>
        <p className="mt-1.5 text-sm text-hisense-soft/50">{t("settings.subtitle")}</p>
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <AccountPanel user={user} t={t} />
        <LanguagePanel lang={lang} setLang={setLang} t={t} />
        <DisplayPanel dateFormat={dateFormat} setDateFormat={setDateFormat} t={t} />
        <DataPanel rows={rows} backendOnline={backendOnline} t={t} />
        <NotificationsPanel t={t} />
        <SystemPanel backendOnline={backendOnline} t={t} />
        <HelpPanel t={t} />
      </div>
    </div>
  );
}

/* ============ AKUN ============ */
function AccountPanel({
  user,
  t,
}: {
  user: { username: string; role: string } | null;
  t: (k: string, v?: Record<string, string | number>) => string;
}) {
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const changePassword = async () => {
    if (newPw.length < 6 || newPw !== confirm) {
      setStatus({ type: "err", msg: t("settings.passwordError") });
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword: oldPw, newPassword: newPw }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus({ type: "err", msg: body.error ?? `HTTP ${res.status}` });
        setSaving(false);
        return;
      }
      setStatus({ type: "ok", msg: t("settings.passwordChanged") });
      setOldPw("");
      setNewPw("");
      setConfirm("");
    } catch (e) {
      setStatus({ type: "err", msg: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <TiltPanel className="anim-fade-up" intensity={3}>
      <PanelHeader icon={<UserCog className="h-4 w-4" />} title={t("settings.account")} subtitle={t("settings.accountSub")} />
      <div className="space-y-5 p-5">
        <div className="glass-premium gold-hairline flex items-center gap-4 rounded-xl p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-hisense/40 to-obsidian-700 font-display text-lg font-bold text-hisense-soft">
            {(user?.username ?? "?").charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-display text-sm font-semibold text-hisense-soft">{user?.username ?? "—"}</p>
            <span className="mt-1 inline-block rounded-full border border-hisense/30 bg-hisense/10 px-2.5 py-0.5 text-[10px] capitalize text-hisense-soft">
              {user?.role ?? "—"}
            </span>
          </div>
        </div>

        <div className="divider-glow" />
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-hisense-soft/60">
          <KeyRound className="h-3.5 w-3.5" /> {t("settings.changePassword")}
        </p>
        <p className="text-[11px] text-hisense-soft/40">{t("settings.changePasswordSub")}</p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <input
            type={show ? "text" : "password"}
            value={oldPw}
            onChange={(e) => setOldPw(e.target.value)}
            placeholder={t("settings.oldPassword")}
            className="w-full rounded-xl border border-hisense/15 bg-obsidian-900/80 px-3.5 py-2.5 text-sm text-hisense-soft outline-none transition-all placeholder:text-hisense-soft/30 focus:border-hisense/60"
          />
          <input
            type={show ? "text" : "password"}
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            placeholder={t("settings.newPassword")}
            className="w-full rounded-xl border border-hisense/15 bg-obsidian-900/80 px-3.5 py-2.5 text-sm text-hisense-soft outline-none transition-all placeholder:text-hisense-soft/30 focus:border-hisense/60"
          />
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={t("settings.confirmPassword")}
              className="w-full rounded-xl border border-hisense/15 bg-obsidian-900/80 px-3.5 py-2.5 pr-10 text-sm text-hisense-soft outline-none transition-all placeholder:text-hisense-soft/30 focus:border-hisense/60"
            />
            <button
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-hisense-soft/50 hover:text-hisense-soft"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {status && (
          <div
            className={cn(
              "flex items-start gap-2 rounded-xl border px-4 py-3 text-xs",
              status.type === "ok"
                ? "border-hisense/30 bg-hisense/10 text-hisense-soft"
                : "border-red-500/30 bg-red-500/10 text-red-300"
            )}
          >
            {status.type === "ok" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-hisense" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />}
            {status.msg}
          </div>
        )}

        <button
          onClick={changePassword}
          disabled={saving || !oldPw || !newPw}
          className="shine-sweep relative flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-hisense-bold via-hisense to-hisense-soft px-5 py-2.5 text-xs font-bold text-obsidian-950 shadow-hisense-glow transition-all hover:shadow-hisense-glow disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Save className="h-3.5 w-3.5" /> {t("settings.save")}
        </button>
      </div>
    </TiltPanel>
  );
}

/* ============ BAHASA ============ */
function LanguagePanel({
  lang,
  setLang,
  t,
}: {
  lang: string;
  setLang: (l: (typeof LANGS)[number]["code"]) => void;
  t: (k: string) => string;
}) {
  return (
    <TiltPanel className="anim-fade-up" intensity={3}>
      <PanelHeader icon={<Languages className="h-4 w-4" />} title={t("settings.language")} subtitle={t("settings.languageSub")} />
      <div className="space-y-2.5 p-5">
        {LANGS.map((l) => {
          const active = lang === l.code;
          return (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={cn(
                "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-all",
                active
                  ? "border-hisense/60 bg-hisense/15 shadow-[0_0_20px_rgba(0,179,172,0.12)]"
                  : "border-hisense/10 bg-obsidian-900/50 hover:border-hisense/30"
              )}
            >
              <div>
                <p className={cn("font-display text-sm font-semibold", active ? "text-hisense-soft" : "text-hisense-soft/70")}>
                  {l.native}
                </p>
                <p className="text-[10px] text-hisense-soft/40">{l.label}</p>
              </div>
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full border",
                  active ? "border-hisense bg-hisense" : "border-hisense/25"
                )}
              >
                {active && <span className="h-2 w-2 rounded-full bg-obsidian-950" />}
              </span>
            </button>
          );
        })}
        <p className="pt-1 text-[10px] text-hisense-soft/35">
          {t("settings.language")}: {LANG_LABEL[lang as keyof typeof LANG_LABEL] ?? lang}
        </p>
      </div>
    </TiltPanel>
  );
}

/* ============ TAMPILAN ============ */
function DisplayPanel({
  dateFormat,
  setDateFormat,
  t,
}: {
  dateFormat: DateFormat;
  setDateFormat: (f: DateFormat) => void;
  t: (k: string) => string;
}) {
  return (
    <TiltPanel className="anim-fade-up" intensity={3}>
      <PanelHeader icon={<CalendarDays className="h-4 w-4" />} title={t("settings.dateFormat")} subtitle={t("settings.dateFormatSub")} />
      <div className="space-y-3 p-5">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {(
            [
              { value: "yyyy-mm-dd", sample: "2026-08-11" },
              { value: "dd/mm/yyyy", sample: "11/08/2026" },
              { value: "mm/dd/yyyy", sample: "08/11/2026" },
            ] as const
          ).map((f) => (
            <button
              key={f.value}
              onClick={() => setDateFormat(f.value)}
              className={cn(
                "rounded-xl border px-2 py-3 text-center transition-all sm:px-3",
                dateFormat === f.value
                  ? "border-hisense/60 bg-hisense/15 text-hisense-soft"
                  : "border-hisense/10 bg-obsidian-900/50 text-hisense-soft/50 hover:border-hisense/30"
              )}
            >
              <p className="font-mono text-xs sm:text-sm">{f.sample}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-hisense-soft/40">{f.value}</p>
            </button>
          ))}
        </div>

        <div className="divider-glow pt-2" />
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-hisense-soft/60">
          <LayoutGrid className="h-3.5 w-3.5" /> {t("settings.display")}
        </p>
        <p className="text-[11px] text-hisense-soft/40">{t("settings.displaySub")}</p>
        <ThemeToggle />
        <ToggleRow label={t("settings.compact")} storageKey="eng_compact" />
      </div>
    </TiltPanel>
  );
}

/* ============ DATA ============ */
function DataPanel({
  rows,
  backendOnline,
  t,
}: {
  rows: DailyRaw[];
  backendOnline: boolean | null;
  t: (k: string, v?: Record<string, string | number>) => string;
}) {
  const [status, setStatus] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const exportCsv = () => {
    const header = Object.keys(rows[0] ?? { date: "date", model: "model", line: "line" }).join(",");
    const body = rows.map((r) => Object.values(r).join(",")).join("\n");
    const blob = new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `raw-engineering-data-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = async () => {
    if (!window.confirm(t("settings.resetConfirm"))) return;
    gantiBaris([...DAILY_RAW]);
    if (backendOnline) {
      try {
        await resetRawData();
      } catch {
        /* fallback lokal */
      }
    }
    setStatus({ type: "ok", msg: t("settings.saved") });
    setTimeout(() => setStatus(null), 2500);
  };

  return (
    <TiltPanel className="anim-fade-up" intensity={3}>
      <PanelHeader icon={<Database className="h-4 w-4" />} title={t("settings.data")} subtitle={t("settings.dataSub")} />
      <div className="space-y-3 p-5">
        <div className="glass-premium gold-hairline rounded-xl px-4 py-3">
          <p className="text-[11px] text-hisense-soft/50">{t("settings.totalRows")}</p>
          <p className="font-display text-hisense-gradient mt-1 text-2xl font-bold">
            {rows.length.toLocaleString()} <span className="text-xs font-normal text-hisense-soft/50">{t("settings.rows")}</span>
          </p>
        </div>

        <button
          onClick={exportCsv}
          className="flex w-full items-center justify-between rounded-xl border border-hisense/20 bg-obsidian-900/60 px-4 py-3 text-left transition-all hover:border-hisense/40 hover:bg-hisense/5"
        >
          <div className="flex items-center gap-3">
            <Download className="h-4 w-4 text-hisense-soft" />
            <div>
              <p className="text-xs font-medium text-hisense-soft">{t("settings.exportCsv")}</p>
              <p className="text-[10px] text-hisense-soft/40">{t("settings.exportCsvSub")}</p>
            </div>
          </div>
        </button>

        <button
          onClick={reset}
          className="flex w-full items-center justify-between rounded-xl border border-red-500/20 bg-obsidian-900/60 px-4 py-3 text-left transition-all hover:border-red-500/40 hover:bg-red-500/5"
        >
          <div className="flex items-center gap-3">
            <RotateCcw className="h-4 w-4 text-red-300" />
            <div>
              <p className="text-xs font-medium text-red-200">{t("settings.resetData")}</p>
              <p className="text-[10px] text-red-300/40">{t("settings.resetDataSub")}</p>
            </div>
          </div>
        </button>

        {status && (
          <div className="flex items-center gap-2 rounded-xl border border-hisense/30 bg-hisense/10 px-4 py-2.5 text-xs text-hisense-soft">
            <CheckCircle2 className="h-4 w-4 text-hisense" /> {status.msg}
          </div>
        )}
      </div>
    </TiltPanel>
  );
}

/* ============ NOTIFIKASI ============ */
function NotificationsPanel({ t }: { t: (k: string) => string }) {
  return (
    <TiltPanel className="anim-fade-up" intensity={3}>
      <PanelHeader icon={<Bell className="h-4 w-4" />} title={t("settings.notifications")} subtitle={t("settings.notificationsSub")} />
      <div className="space-y-3 p-5">
        <ToggleRow label={t("settings.notif.overdue")} storageKey="eng_notif_overdue" defaultOn />
        <ToggleRow label={t("settings.notif.kpi")} storageKey="eng_notif_kpi" defaultOn />
        <ToggleRow label={t("settings.notif.audio")} storageKey="eng_notif_audio" />
      </div>
    </TiltPanel>
  );
}

/* ============ SISTEM ============ */
function SystemPanel({
  backendOnline,
  t,
}: {
  backendOnline: boolean | null;
  t: (k: string) => string;
}) {
  return (
    <TiltPanel className="anim-fade-up" intensity={3}>
      <PanelHeader icon={<Server className="h-4 w-4" />} title={t("settings.system")} subtitle={t("settings.systemSub")} />
      <div className="space-y-3 p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="glass-premium gold-hairline rounded-xl px-4 py-3">
            <p className="text-[11px] text-hisense-soft/50">{t("settings.version")}</p>
            <p className="font-display mt-1 text-lg font-bold text-hisense-soft">v1.0.0</p>
          </div>
          <div className="glass-premium gold-hairline rounded-xl px-4 py-3">
            <p className="text-[11px] text-hisense-soft/50">{t("settings.backendStatus")}</p>
            <p className="mt-1 flex items-center gap-2 text-sm font-semibold">
              <span className={cn("h-2 w-2 rounded-full", backendOnline ? "bg-hisense" : "bg-red-400")} />
              <span className={backendOnline ? "text-hisense-soft" : "text-red-300"}>
                {backendOnline === null ? "…" : backendOnline ? t("settings.online") : t("settings.offline")}
              </span>
            </p>
          </div>
        </div>
        <div className="glass-premium gold-hairline rounded-xl px-4 py-3">
          <p className="flex items-center gap-2 text-[11px] text-hisense-soft/50">
            <Wrench className="h-3.5 w-3.5" /> {t("app.subtitle")} — Next.js 16 · FastAPI · ECharts
          </p>
        </div>
      </div>
    </TiltPanel>
  );
}

/* ============ BANTUAN ============ */
function HelpPanel({ t }: { t: (k: string) => string }) {
  return (
    <TiltPanel className="anim-fade-up" intensity={3}>
      <PanelHeader icon={<HelpCircle className="h-4 w-4" />} title={t("settings.help")} subtitle={t("settings.helpSub")} />
      <div className="space-y-3 p-5">
        <Link
          href="/bantuan"
          className="group flex w-full items-center justify-between rounded-xl border border-hisense/20 bg-obsidian-900/60 px-4 py-3 text-left transition-all hover:border-hisense/40 hover:bg-hisense/5"
        >
          <div className="flex items-center gap-3">
            <HelpCircle className="h-4 w-4 text-hisense-soft" />
            <div>
              <p className="text-xs font-medium text-hisense-soft">{t("bantuan.title")}</p>
              <p className="text-[10px] text-hisense-soft/40">{t("settings.helpGuideSub")}</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-hisense-soft/40 transition-transform group-hover:translate-x-0.5 group-hover:text-hisense-soft" />
        </Link>

        <Link
          href="/privacy"
          className="group flex w-full items-center justify-between rounded-xl border border-hisense/20 bg-obsidian-900/60 px-4 py-3 text-left transition-all hover:border-hisense/40 hover:bg-hisense/5"
        >
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-4 w-4 text-hisense-soft" />
            <div>
              <p className="text-xs font-medium text-hisense-soft">{t("privacy.title")}</p>
              <p className="text-[10px] text-hisense-soft/40">{t("settings.helpPrivacySub")}</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-hisense-soft/40 transition-transform group-hover:translate-x-0.5 group-hover:text-hisense-soft" />
        </Link>
      </div>
    </TiltPanel>
  );
}

/* ============ TOGGLE ============ */
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="glass-premium gold-hairline flex items-center justify-between rounded-xl px-4 py-3">
      <p className="text-xs text-hisense-soft/70">{theme === "dark" ? "Dark Mode" : "Light Mode"}</p>
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors duration-300",
          theme === "light" ? "bg-hisense" : "bg-obsidian-700"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow transition-all duration-300",
            theme === "light" ? "left-[22px]" : "left-0.5"
          )}
        >
          {theme === "dark" ? <Moon className="h-3 w-3 text-obsidian-600" /> : <Sun className="h-3 w-3 text-amber-500" />}
        </span>
      </button>
    </div>
  );
}

function ToggleRow({ label, storageKey, defaultOn = false }: { label: string; storageKey: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(() => {
    if (typeof window === "undefined") return defaultOn;
    const saved = window.localStorage.getItem(storageKey);
    return saved === null ? defaultOn : saved === "1";
  });

  useEffect(() => {
    window.localStorage.setItem(storageKey, on ? "1" : "0");
  }, [on, storageKey]);

  return (
    <div className="glass-premium gold-hairline flex items-center justify-between rounded-xl px-4 py-3">
      <p className="text-xs text-hisense-soft/70">{label}</p>
      <button
        onClick={() => setOn((s) => !s)}
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors duration-300",
          on ? "bg-hisense" : "bg-obsidian-700"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-300",
            on ? "left-[22px]" : "left-0.5"
          )}
        />
      </button>
    </div>
  );
}
