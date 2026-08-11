"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Gauge,
  ShieldCheck,
  Wrench,
  Activity,
  ChevronRight,
  PenLine,
  FileSpreadsheet,
  Clock,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  HelpCircle,
  Lock,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserSession } from "@/components/user-session";
import { LogoIcon } from "@/components/logo";
import { useI18n } from "@/lib/i18n/provider";
import { useTheme } from "@/lib/theme";
import { Sun, Moon } from "lucide-react";

const NAV: { href: string; key: string; icon: LucideIcon }[] = [
  { href: "/", key: "nav.dashboard", icon: LayoutDashboard },
  { href: "/process", key: "nav.process", icon: Gauge },
  { href: "/quality", key: "nav.quality", icon: ShieldCheck },
  { href: "/engineering", key: "nav.engineering", icon: Wrench },
  { href: "/setup", key: "nav.setup", icon: Clock },
];

const INPUT_NAV: { href: string; key: string; icon: LucideIcon }[] = [
  { href: "/input", key: "nav.inputManual", icon: PenLine },
  { href: "/impor", key: "nav.impor", icon: FileSpreadsheet },
];

const SETTINGS_NAV: { href: string; key: string; icon: LucideIcon }[] = [
  { href: "/settings", key: "menu.settings", icon: Settings },
];

const HELP_NAV: { href: string; key: string; icon: LucideIcon }[] = [
  { href: "/bantuan", key: "nav.bantuan", icon: HelpCircle },
  { href: "/privacy", key: "nav.privacy", icon: Lock },
];

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center rounded-xl px-3.5 py-3 text-base font-medium transition-all duration-300",
        collapsed ? "justify-center gap-0 px-0" : "gap-3",
        active
          ? "bg-gradient-to-r from-cyan-400/25 via-hisense/15 to-transparent text-hisense-soft shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
          : "text-hisense-soft/75 hover:bg-cyan-400/10 hover:text-hisense-soft"
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-cyan-200 to-cyan-500 shadow-[0_0_14px_rgba(34,211,238,0.9)]" />
      )}
      <Icon
        className={cn(
          "h-[21px] w-[21px] shrink-0 transition-transform duration-300",
          active ? "text-hisense-soft" : "text-hisense-soft/60 group-hover:scale-110 group-hover:text-hisense-soft"
        )}
      />
      <span
        className={cn(
          "overflow-hidden whitespace-nowrap transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          collapsed
            ? "max-w-0 -translate-x-2 opacity-0"
            : "max-w-[200px] translate-x-0 opacity-100"
        )}
      >
        {label}
      </span>
      <ChevronRight
        className={cn(
          "ml-auto h-5 w-5 shrink-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          collapsed ? "max-w-0 opacity-0" : "max-w-5 opacity-100",
          active ? "text-hisense" : "opacity-0 group-hover:opacity-60"
        )}
      />
    </Link>
  );
}

export function Sidebar({
  collapsed,
  onToggle,
  mobileOpen = false,
  onCloseMobile,
}: {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}) {
  const pathname = usePathname();
  const { t } = useI18n();
  const { theme, setTheme } = useTheme();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => {
        if (alive) setRole(d.user?.role ?? null);
      })
      .catch(() => {
        if (alive) setRole(null);
      });
    return () => {
      alive = false;
    };
  }, [pathname]);

  const isLimited = role === "viewer" || role === "qc";
  const showInput = !isLimited;
  const showSettings = !isLimited;

  // Di mobile (drawer) sidebar selalu expanded; collapsed hanya berlaku di lg+.
  const effectiveCollapsed = collapsed && !mobileOpen;

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-obsidian-950/60 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 border-r border-hisense/10 bg-obsidian-900/90 backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          "lg:z-40 lg:transition-[width]",
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0 lg:shadow-none",
          effectiveCollapsed ? "lg:w-16" : "w-64"
        )}
      >
      <div className="flex h-full flex-col">
        <div className={cn("pt-7", effectiveCollapsed ? "flex flex-col items-center gap-4" : "px-6")}>
          <div className={cn("flex items-center", effectiveCollapsed ? "justify-center" : "justify-between gap-3")}>
            <Link
              href="/"
              className="anim-scale-in flex items-center gap-3 transition-opacity hover:opacity-90"
              style={{ animationDelay: "80ms" }}
            >
              <div className="relative">
                <div
                  className={cn(
                    "glow-ring absolute -inset-2 animate-pulse-glow transition-opacity duration-500",
                    effectiveCollapsed ? "opacity-0" : "opacity-60"
                  )}
                />
                <LogoIcon size={effectiveCollapsed ? "sm" : "md"} />
              </div>
              <div
                className={cn(
                  "overflow-hidden whitespace-nowrap transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  effectiveCollapsed ? "max-w-0 -translate-x-3 opacity-0" : "max-w-[128px] translate-x-0 opacity-100"
                )}
              >
                <p className="font-cinzel text-sm font-bold tracking-[0.18em] text-hisense-gradient uppercase">
                  {t("app.title")}
                </p>
                <p className="text-[11px] italic text-hisense-soft/60">{t("app.subtitle")}</p>
              </div>
            </Link>
            {!effectiveCollapsed && (
              <button
                onClick={onToggle}
                title={t("nav.collapse")}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-hisense-soft/60 transition-all hover:bg-hisense/10 hover:text-hisense-soft"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            )}
          </div>
          {effectiveCollapsed && (
            <button
              onClick={onToggle}
              title={t("nav.expand")}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-hisense-soft/60 transition-all hover:bg-hisense/10 hover:text-hisense-soft"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="lux-divider mx-6 mt-6" />

        <nav className="mt-6 flex-1 space-y-1.5 overflow-y-auto px-4">
          <div
            className={cn(
              "overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
              effectiveCollapsed ? "max-h-0 opacity-0" : "max-h-12 opacity-100"
            )}
          >
            <p className="lux-eyebrow px-3 pb-2 opacity-70">{t("menu.main")}</p>
          </div>
          {NAV.map(({ href, key, icon }) => (
            <NavLink key={href} href={href} label={t(key)} icon={icon} active={pathname === href} collapsed={effectiveCollapsed} />
          ))}

          {showInput && (
            <div
              className={cn(
                "overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                effectiveCollapsed ? "max-h-0 opacity-0" : "max-h-12 opacity-100"
              )}
            >
              <p className="lux-eyebrow px-3 pb-2 pt-5 opacity-70">{t("menu.input")}</p>
            </div>
          )}
          {showInput &&
            INPUT_NAV.map(({ href, key, icon }) => (
              <NavLink key={href} href={href} label={t(key)} icon={icon} active={pathname === href} collapsed={effectiveCollapsed} />
            ))}

          {showSettings && (
            <div
              className={cn(
                "overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                effectiveCollapsed ? "max-h-0 opacity-0" : "max-h-12 opacity-100"
              )}
            >
              <p className="lux-eyebrow px-3 pb-2 pt-5 opacity-70">{t("menu.settings")}</p>
            </div>
          )}
          {showSettings &&
            SETTINGS_NAV.map(({ href, key, icon }) => (
              <NavLink key={href} href={href} label={t(key)} icon={icon} active={pathname === href} collapsed={effectiveCollapsed} />
            ))}

          <div
            className={cn(
              "overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
              effectiveCollapsed ? "max-h-0 opacity-0" : "max-h-12 opacity-100"
            )}
          >
            <p className="lux-eyebrow px-3 pb-2 pt-5 opacity-70">{t("menu.help")}</p>
          </div>
          {HELP_NAV.map(({ href, key, icon }) => (
            <NavLink
              key={href}
              href={href}
              label={t(key)}
              icon={icon}
              active={pathname === href}
              collapsed={effectiveCollapsed}
            />
          ))}
        </nav>

        <div
          className={cn(
            "overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            effectiveCollapsed ? "max-h-0 opacity-0" : "max-h-56 opacity-100"
          )}
        >
          <div className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="lux-eyebrow opacity-70">{t("system.online")}</p>
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                title={theme === "dark" ? "Light Mode" : "Dark Mode"}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-hisense/15 text-hisense-soft/70 transition-all hover:bg-hisense/10 hover:text-hisense-soft"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>
            <UserSession />
            <div className="gold-hairline mt-4 rounded-2xl border border-hisense/15 bg-obsidian-850/70 p-4">
              <div className="flex items-center gap-2">
                <span className="live-dot" />
                <p className="font-cinzel text-xs font-semibold tracking-wider text-hisense-soft uppercase">
                  {t("system.online")}
                </p>
              </div>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-hisense-soft/50">
                <Activity className="h-3.5 w-3.5" />
                <span>{t("system.lastData")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
    </>
  );
}
