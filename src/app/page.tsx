"use client";

import { useEffect, useState } from "react";
import { Monitor } from "lucide-react";
import { LogoIcon } from "@/components/logo";
import { DashboardView } from "@/components/dashboard-view";
import { muatDariBackend } from "@/lib/store";
import { muatEngineering } from "@/lib/store-engineering";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

const REFRESH_MS = 5 * 60 * 1000;

export default function DashboardPage() {
  const { t } = useI18n();
  const [periode, setPeriode] = useState<1 | 7 | 14 | 30>(30);
  const [range, setRange] = useState<{ from: string; to: string } | null>(null);

  useEffect(() => {
    const id = setInterval(() => {
      void muatDariBackend();
      void muatEngineering();
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  const todayIso = () => new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = () => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return d.toISOString().slice(0, 10);
  };

  const setRangeFrom = (from: string) => {
    const to = range?.to ?? todayIso();
    setRange(from > to ? { from: to, to: from } : { from, to });
  };
  const setRangeTo = (to: string) => {
    const from = range?.from ?? thirtyDaysAgo();
    setRange(from > to ? { from: to, to: from } : { from, to });
  };

  const dateInputCls =
    "rounded-lg border border-hisense/20 bg-obsidian-850/70 px-3 py-1.5 text-xs text-hisense-soft outline-none transition-colors focus:border-hisense/50";
  const inRange = !!range;
  const modeBtn = (active: boolean) =>
    cn(
      "font-cinzel rounded-full border px-4 py-1.5 text-xs font-medium tracking-wide transition-colors",
      active ? "border-hisense/60 bg-hisense/15 text-hisense-soft" : "border-hisense/10 text-hisense-soft/75 hover:text-hisense-soft"
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
            <LogoIcon size="md" />
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
          <button
            onClick={() => window.open("/display", "_blank")}
            className="font-cinzel flex items-center gap-2 rounded-full border border-hisense/40 bg-hisense/10 px-4 py-2 text-xs font-medium tracking-wide text-hisense-soft transition-colors hover:border-hisense/70 hover:bg-hisense/20"
          >
            <Monitor className="h-4 w-4" />
            {t("dash.tampilDisplay")}
          </button>
          <div className="flex items-center gap-1.5 rounded-full border border-hisense/15 bg-obsidian-850/60 p-1.5">
            {([1, 7, 14, 30] as const).map((n) => (
              <button
                key={n}
                onClick={() => {
                  setPeriode(n);
                  setRange(null);
                }}
                className={modeBtn(!inRange && periode === n)}
              >
                {n === 1 ? t("periode.harian") : t("periode.hari", { n })}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-hisense/15 bg-obsidian-850/60 p-1.5">
            <input
              type="date"
              value={range?.from ?? thirtyDaysAgo()}
              onChange={(e) => setRangeFrom(e.target.value)}
              className={cn(dateInputCls, inRange && "border-hisense/60")}
              aria-label={t("dash.dateFrom")}
            />
            <span className="text-xs text-hisense-soft/50">—</span>
            <input
              type="date"
              value={range?.to ?? todayIso()}
              onChange={(e) => setRangeTo(e.target.value)}
              className={cn(dateInputCls, inRange && "border-hisense/60")}
              aria-label={t("dash.dateTo")}
            />
            {inRange && (
              <button
                onClick={() => setRange(null)}
                className={cn(modeBtn(false), "border-gold-400/40 text-gold-300 hover:text-gold-200")}
              >
                {t("dash.dateReset")}
              </button>
            )}
          </div>
        </div>
      </header>

      <DashboardView periode={periode} range={range} />
    </div>
  );
}
