"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Gauge,
  ShieldCheck,
  Wrench,
  Hexagon,
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
import { useI18n } from "@/lib/i18n/provider";

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
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-300",
        collapsed && "justify-center px-0",
        active
          ? "bg-gradient-to-r from-hisense/20 to-transparent text-hisense-soft"
          : "text-hisense-soft/60 hover:bg-hisense/8 hover:text-hisense-bold"
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-hisense-soft to-hisense shadow-[0_0_12px_rgba(0,179,172,0.8)]" />
      )}
      <Icon
        className={cn(
          "h-[18px] w-[18px] shrink-0 transition-transform duration-300",
          active ? "text-hisense-soft" : "text-hisense-soft/50 group-hover:scale-110"
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
          "ml-auto h-4 w-4 shrink-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          collapsed ? "max-w-0 opacity-0" : "max-w-4 opacity-100",
          active ? "text-hisense" : "opacity-0 group-hover:opacity-40"
        )}
      />
    </Link>
  );
}

export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 border-r border-hisense/10 bg-obsidian-900/80 backdrop-blur-xl transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        <div className={cn("pt-7", collapsed ? "flex flex-col items-center gap-4" : "px-6")}>
          <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between gap-3")}>
            <Link
              href="/"
              className="anim-scale-in flex items-center gap-3 transition-opacity hover:opacity-90"
              style={{ animationDelay: "80ms" }}
            >
              <div className="relative">
                <div
                  className={cn(
                    "glow-ring absolute -inset-2 animate-pulse-glow transition-opacity duration-500",
                    collapsed ? "opacity-0" : "opacity-60"
                  )}
                />
                <div
                  className={cn(
                    "relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-hisense via-hisense-bold to-obsidian-700 shadow-hisense-glow transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    collapsed ? "h-9 w-9" : "h-11 w-11"
                  )}
                >
                  <Hexagon
                    className={cn(
                      "text-obsidian-950 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                      collapsed ? "h-5 w-5" : "h-6 w-6"
                    )}
                    strokeWidth={2.4}
                  />
                </div>
              </div>
              <div
                className={cn(
                  "overflow-hidden whitespace-nowrap transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  collapsed ? "max-w-0 -translate-x-3 opacity-0" : "max-w-[220px] translate-x-0 opacity-100"
                )}
              >
                <p className="font-cinzel text-sm font-bold tracking-[0.18em] text-hisense-gradient uppercase">
                  {t("app.title")}
                </p>
                <p className="text-[11px] italic text-hisense-soft/60">{t("app.subtitle")}</p>
              </div>
            </Link>
            {!collapsed && (
              <button
                onClick={onToggle}
                title={t("nav.collapse")}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-hisense-soft/60 transition-all hover:bg-hisense/10 hover:text-hisense-soft"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            )}
          </div>
          {collapsed && (
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
              collapsed ? "max-h-0 opacity-0" : "max-h-6 opacity-100"
            )}
          >
            <p className="lux-eyebrow px-3 pb-2 opacity-70">{t("menu.main")}</p>
          </div>
          {NAV.map(({ href, key, icon }) => (
            <NavLink key={href} href={href} label={t(key)} icon={icon} active={pathname === href} collapsed={collapsed} />
          ))}

          <div
            className={cn(
              "overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
              collapsed ? "max-h-0 opacity-0" : "max-h-6 opacity-100"
            )}
          >
            <p className="lux-eyebrow px-3 pb-2 pt-5 opacity-70">{t("menu.input")}</p>
          </div>
          {INPUT_NAV.map(({ href, key, icon }) => (
            <NavLink key={href} href={href} label={t(key)} icon={icon} active={pathname === href} collapsed={collapsed} />
          ))}

          <div
            className={cn(
              "overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
              collapsed ? "max-h-0 opacity-0" : "max-h-6 opacity-100"
            )}
          >
            <p className="lux-eyebrow px-3 pb-2 pt-5 opacity-70">{t("menu.settings")}</p>
          </div>
          {SETTINGS_NAV.map(({ href, key, icon }) => (
            <NavLink key={href} href={href} label={t(key)} icon={icon} active={pathname === href} collapsed={collapsed} />
          ))}

          <div
            className={cn(
              "overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
              collapsed ? "max-h-0 opacity-0" : "max-h-6 opacity-100"
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
              collapsed={collapsed}
            />
          ))}
        </nav>

        <div
          className={cn(
            "overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            collapsed ? "max-h-0 opacity-0" : "max-h-56 opacity-100"
          )}
        >
          <div className="p-4">
            <UserSession />
            <div className="gold-hairline mt-4 rounded-2xl border border-hisense/15 bg-obsidian-850/70 p-4">
              <div className="flex items-center gap-2">
                <span className="live-dot" />
                <p className="font-cinzel text-xs font-semibold tracking-wider text-hisense-bold uppercase">
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
  );
}
