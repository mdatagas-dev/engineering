"use client";

import {
  LogIn,
  ShieldCheck,
  Wrench,
  Eye,
  LayoutDashboard,
  Gauge,
  ShieldCheck as QualityIcon,
  Wrench as EngIcon,
  Clock,
  PenLine,
  FileSpreadsheet,
  Settings,
  Lightbulb,
} from "lucide-react";
import { TiltPanel } from "@/components/tilt-panel";
import { PanelHeader } from "@/components/panel-header";
import { useI18n } from "@/lib/i18n/provider";
import type { LucideIcon } from "lucide-react";

type Item = { icon: LucideIcon; label: string; desc: string };

function ItemRow({ item }: { item: Item }) {
  return (
    <div className="glass-premium gold-hairline flex items-start gap-3 rounded-xl p-4">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-hisense/20 bg-hisense/10">
        <item.icon className="h-4 w-4 text-hisense-soft" />
      </div>
      <div className="min-w-0">
        {item.label && <p className="text-xs font-semibold text-hisense-soft">{item.label}</p>}
        <p className="text-xs leading-relaxed text-hisense-soft/60">{item.desc}</p>
      </div>
    </div>
  );
}

export default function BantuanPage() {
  const { t } = useI18n();

  const roles: Item[] = [
    { icon: ShieldCheck, label: t("role.admin"), desc: t("role.desc.admin") },
    { icon: Wrench, label: t("role.engineer"), desc: t("role.desc.engineer") },
    { icon: Eye, label: t("role.viewer"), desc: t("role.desc.viewer") },
  ];

  const pages: Item[] = [
    { icon: LayoutDashboard, label: t("nav.dashboard"), desc: t("bantuan.pages.dashboard") },
    { icon: Gauge, label: t("nav.process"), desc: t("bantuan.pages.process") },
    { icon: QualityIcon, label: t("nav.quality"), desc: t("bantuan.pages.quality") },
    { icon: EngIcon, label: t("nav.engineering"), desc: t("bantuan.pages.engineering") },
    { icon: Clock, label: t("nav.setup"), desc: t("bantuan.pages.setup") },
  ];

  const fields: Item[] = [
    { icon: PenLine, label: "Model", desc: t("bantuan.input.model") },
    { icon: LayoutDashboard, label: "Line", desc: t("bantuan.input.line") },
    { icon: Clock, label: "Date", desc: t("bantuan.input.date") },
    { icon: Gauge, label: "Input Qty", desc: t("bantuan.input.qty") },
    { icon: ShieldCheck, label: "First Pass Good", desc: t("bantuan.input.fpg") },
    { icon: QualityIcon, label: "Defect Qty", desc: t("bantuan.input.defect") },
    { icon: Clock, label: "Planned / Downtime", desc: t("bantuan.input.minutes") },
    { icon: Gauge, label: "Target / Actual CT", desc: t("bantuan.input.ct") },
    { icon: Wrench, label: "Standard / Actual Setup", desc: t("bantuan.input.setup") },
  ];

  return (
    <div className="space-y-6">
      <header className="anim-fade-up">
        <p className="lux-eyebrow mb-2">{t("menu.bantuan")}</p>
        <h1 className="font-display text-hisense-gradient text-4xl font-bold text-glow lg:text-5xl">{t("bantuan.title")}</h1>
        <p className="mt-1.5 text-sm text-hisense-soft/50">{t("bantuan.subtitle")}</p>
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <TiltPanel className="anim-fade-up" intensity={3}>
          <PanelHeader icon={<LogIn className="h-4 w-4" />} title={t("bantuan.login.title")} subtitle={t("bantuan.subtitle")} />
          <div className="space-y-3 p-5">
            <p className="text-xs leading-relaxed text-hisense-soft/70">{t("bantuan.login.text")}</p>
            {roles.map((item) => (
              <ItemRow key={item.label} item={item} />
            ))}
          </div>
        </TiltPanel>

        <TiltPanel className="anim-fade-up" intensity={3}>
          <PanelHeader icon={<LayoutDashboard className="h-4 w-4" />} title={t("bantuan.pages.title")} subtitle={t("bantuan.subtitle")} />
          <div className="space-y-3 p-5">
            {pages.map((item) => (
              <ItemRow key={item.label} item={item} />
            ))}
          </div>
        </TiltPanel>

        <TiltPanel className="anim-fade-up xl:col-span-2" intensity={3}>
          <PanelHeader icon={<PenLine className="h-4 w-4" />} title={t("bantuan.input.title")} subtitle={t("bantuan.subtitle")} />
          <div className="p-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {fields.map((item) => (
                <ItemRow key={item.label} item={item} />
              ))}
            </div>
            <div className="mt-3 rounded-xl border border-gold-400/25 bg-gold-400/5 px-4 py-3 text-xs leading-relaxed text-gold-300/80">
              {t("bantuan.input.validasi")}
            </div>
          </div>
        </TiltPanel>

        <TiltPanel className="anim-fade-up" intensity={3}>
          <PanelHeader icon={<FileSpreadsheet className="h-4 w-4" />} title={t("bantuan.import.title")} subtitle={t("bantuan.subtitle")} />
          <div className="p-5">
            <p className="text-xs leading-relaxed text-hisense-soft/70">{t("bantuan.import.text")}</p>
          </div>
        </TiltPanel>

        <TiltPanel className="anim-fade-up" intensity={3}>
          <PanelHeader icon={<Wrench className="h-4 w-4" />} title={t("bantuan.engQual.title")} subtitle={t("bantuan.subtitle")} />
          <div className="p-5">
            <p className="text-xs leading-relaxed text-hisense-soft/70">{t("bantuan.engQual.text")}</p>
          </div>
        </TiltPanel>

        <TiltPanel className="anim-fade-up" intensity={3}>
          <PanelHeader icon={<Settings className="h-4 w-4" />} title={t("bantuan.settings.title")} subtitle={t("bantuan.subtitle")} />
          <div className="p-5">
            <p className="text-xs leading-relaxed text-hisense-soft/70">{t("bantuan.settings.text")}</p>
          </div>
        </TiltPanel>

        <TiltPanel className="anim-fade-up" intensity={3}>
          <PanelHeader icon={<Lightbulb className="h-4 w-4" />} title={t("bantuan.tips.title")} subtitle={t("bantuan.subtitle")} />
          <div className="p-5">
            <p className="text-xs leading-relaxed text-hisense-soft/70">{t("bantuan.tips.text")}</p>
          </div>
        </TiltPanel>
      </div>
    </div>
  );
}
