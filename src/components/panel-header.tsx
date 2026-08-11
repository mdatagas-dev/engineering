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
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-jade-400/20 bg-jade-500/10 text-jade-300">
          {icon}
        </div>
        <div>
          <h3 className="font-display text-sm font-semibold text-jade-200">{title}</h3>
          <p className="text-[11px] text-jade-300/45">{subtitle}</p>
        </div>
      </div>
      {right}
    </div>
  );
}
