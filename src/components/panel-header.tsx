import type { ReactNode } from "react";

export function PanelHeader({
  icon,
  title,
  subtitle,
  right,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 pt-5">
      <div className="flex items-center gap-3.5">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-hisense/25 bg-gradient-to-br from-hisense/15 to-obsidian-800 text-hisense-soft shadow-hisense/20">
          <span className="icon-breathe">{icon}</span>
        </div>
        <div>
          <h3 className="font-display text-3xl font-semibold tracking-wide text-hisense-soft text-shadow-luxe">
            {title}
          </h3>
          <p className="mt-1 text-base text-hisense-soft/70">{subtitle}</p>
        </div>
      </div>
      {right}
    </div>
  );
}
