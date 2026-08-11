"use client";

import { Hexagon } from "lucide-react";
import { cn } from "@/lib/utils";

export function LogoIcon({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const outer = size === "lg" ? "h-14 w-14" : size === "md" ? "h-12 w-12" : "h-9 w-9";
  const ring = size === "lg" ? "h-11 w-11" : size === "md" ? "h-9 w-9" : "h-7 w-7";
  const tile = size === "lg" ? "h-7 w-7" : size === "md" ? "h-6 w-6" : "h-5 w-5";
  const icon = size === "lg" ? "h-5 w-5" : size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  const clip = "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)";
  return (
    <div className={cn("flex shrink-0 items-center justify-center", outer)}>
      <div
        className="flex h-full w-full items-center justify-center"
        style={{
          background: "conic-gradient(from 210deg, #f25022, #7fba00, #00a4ef, #ffb900, #f25022)",
          clipPath: clip,
        }}
      >
        <div
          className="flex h-full w-full items-center justify-center"
          style={{
            background: "conic-gradient(from 210deg, #f25022, #7fba00, #00a4ef, #ffb900, #f25022)",
            clipPath: clip,
          }}
        >
          <div className={cn("flex items-center justify-center rounded-md bg-white shadow", ring, tile)}>
            <Hexagon className={cn("text-neutral-700", icon)} strokeWidth={2.4} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function Logo({ size = "md", showText = true }: { size?: "sm" | "md" | "lg"; showText?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <LogoIcon size={size} />
      {showText && (
        <div className="text-left leading-tight">
          <p className="font-cinzel text-base font-bold uppercase tracking-[0.18em] text-hisense-gradient">
            EPD
          </p>
          <p className="text-[11px] italic text-hisense-soft/60">Engineering Performance Dashboard</p>
        </div>
      )}
    </div>
  );
}
