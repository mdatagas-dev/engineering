"use client";

import {
  ShieldCheck,
  Database,
  Goal,
  Scale,
  Lock,
  Cookie,
  FileClock,
} from "lucide-react";
import { TiltPanel } from "@/components/tilt-panel";
import { PanelHeader } from "@/components/panel-header";
import { useI18n } from "@/lib/i18n/provider";
import type { LucideIcon } from "lucide-react";

type Item = { icon: LucideIcon; label: string; desc: string };

function ItemRow({ item }: { item: Item }) {
  return (
    <div className="glass-premium flex items-start gap-3 rounded-xl p-4">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-hisense/20 bg-hisense/10">
        <item.icon className="h-4 w-4 text-hisense-soft" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-hisense-soft">{item.label}</p>
        <p className="mt-1 text-xs leading-relaxed text-hisense-soft/60">{item.desc}</p>
      </div>
    </div>
  );
}

export default function PrivacyPage() {
  const { t } = useI18n();

  const dataItems: Item[] = [
    { icon: ShieldCheck, label: t("privacy.data.account"), desc: "" },
    { icon: Database, label: t("privacy.data.production"), desc: "" },
    { icon: Lock, label: t("privacy.data.technical"), desc: "" },
  ];

  const purposeItems: Item[] = [
    { icon: Goal, label: t("privacy.purpose.kpi"), desc: "" },
    { icon: Database, label: t("privacy.purpose.storage"), desc: "" },
    { icon: Lock, label: t("privacy.purpose.personalization"), desc: "" },
  ];

  const securityItems: Item[] = [
    { icon: Database, label: t("privacy.security.storage"), desc: "" },
    { icon: ShieldCheck, label: t("privacy.security.auth"), desc: "" },
    { icon: Lock, label: t("privacy.security.roles"), desc: "" },
  ];

  const rights = t("privacy.rights.text").split("\n");

  return (
    <div className="space-y-6">
      <header className="anim-fade-up">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-hisense-soft/50">{t("menu.privacy")}</p>
        <h1 className="font-display text-hisense-gradient mt-2 text-3xl font-bold text-glow">{t("privacy.title")}</h1>
        <p className="mt-1.5 text-sm text-hisense-soft/50">{t("privacy.subtitle")}</p>
      </header>

      <TiltPanel className="anim-fade-up" intensity={2}>
        <div className="p-6">
          <p className="text-sm leading-relaxed text-hisense-soft/70">{t("privacy.intro")}</p>
        </div>
      </TiltPanel>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <TiltPanel className="anim-fade-up" intensity={3}>
          <PanelHeader icon={<Database className="h-4 w-4" />} title={t("privacy.data.title")} subtitle={t("privacy.subtitle")} />
          <div className="space-y-3 p-5">
            {dataItems.map((item) => (
              <ItemRow key={item.label} item={item} />
            ))}
          </div>
        </TiltPanel>

        <TiltPanel className="anim-fade-up" intensity={3}>
          <PanelHeader icon={<Goal className="h-4 w-4" />} title={t("privacy.purpose.title")} subtitle={t("privacy.subtitle")} />
          <div className="space-y-3 p-5">
            {purposeItems.map((item) => (
              <ItemRow key={item.label} item={item} />
            ))}
          </div>
        </TiltPanel>

        <TiltPanel className="anim-fade-up" intensity={3}>
          <PanelHeader icon={<Scale className="h-4 w-4" />} title={t("privacy.legal.title")} subtitle={t("privacy.subtitle")} />
          <div className="space-y-3 p-5">
            <p className="text-xs leading-relaxed text-hisense-soft/70">{t("privacy.legal.text")}</p>
            <div className="space-y-2">
              {rights.map((line) => {
                const sep = line.indexOf(" — ");
                const label = sep > -1 ? line.slice(0, sep) : line;
                const desc = sep > -1 ? line.slice(sep + 3) : "";
                return (
                  <div key={label} className="glass-premium flex items-start gap-2.5 rounded-xl px-4 py-2.5 text-xs">
                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-hisense" />
                    <p className="text-hisense-soft/70">
                      <span className="font-semibold text-hisense-soft">{label}</span>
                      {desc && <span> — {desc}</span>}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </TiltPanel>

        <div className="space-y-6">
          <TiltPanel className="anim-fade-up" intensity={3}>
            <PanelHeader icon={<Lock className="h-4 w-4" />} title={t("privacy.security.title")} subtitle={t("privacy.subtitle")} />
            <div className="space-y-3 p-5">
              {securityItems.map((item) => (
                <ItemRow key={item.label} item={item} />
              ))}
            </div>
          </TiltPanel>

          <TiltPanel className="anim-fade-up" intensity={3}>
            <PanelHeader icon={<Cookie className="h-4 w-4" />} title={t("privacy.cookies.title")} subtitle={t("privacy.subtitle")} />
            <div className="p-5">
              <p className="text-xs leading-relaxed text-hisense-soft/70">{t("privacy.cookies.text")}</p>
            </div>
          </TiltPanel>

          <TiltPanel className="anim-fade-up" intensity={3}>
            <PanelHeader icon={<FileClock className="h-4 w-4" />} title={t("privacy.updates.title")} subtitle={t("privacy.subtitle")} />
            <div className="p-5">
              <p className="text-xs leading-relaxed text-hisense-soft/70">{t("privacy.updates.text")}</p>
            </div>
          </TiltPanel>
        </div>
      </div>
    </div>
  );
}
