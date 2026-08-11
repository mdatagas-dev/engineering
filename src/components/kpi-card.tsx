"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { TiltPanel } from "@/components/tilt-panel";
import { cn } from "@/lib/utils";

const ACCENT = {
  jade: {
    chip: "from-cyan-400 to-cyan-600 text-obsidian-950 shadow-cyan-500/40",
    dot: "bg-cyan-400",
    glow: "shadow-cyan-500/30",
    hex: "#67e8f9",
  },
  gold: {
    chip: "from-amber-300 to-amber-500 text-obsidian-950 shadow-amber-500/40",
    dot: "bg-amber-300",
    glow: "shadow-amber-500/30",
    hex: "#fde68a",
  },
  teal: {
    chip: "from-emerald-400 to-emerald-600 text-obsidian-950 shadow-emerald-500/40",
    dot: "bg-emerald-400",
    glow: "shadow-emerald-500/30",
    hex: "#86efac",
  },
  emerald: {
    chip: "from-violet-400 to-violet-600 text-obsidian-950 shadow-violet-500/40",
    dot: "bg-violet-400",
    glow: "shadow-violet-500/30",
    hex: "#c4b5fd",
  },
  rose: {
    chip: "from-rose-400 to-rose-600 text-obsidian-950 shadow-rose-500/40",
    dot: "bg-rose-400",
    glow: "shadow-rose-500/30",
    hex: "#fda4af",
  },
  blue: {
    chip: "from-blue-400 to-blue-600 text-obsidian-950 shadow-blue-500/40",
    dot: "bg-blue-400",
    glow: "shadow-blue-500/30",
    hex: "#93c5fd",
  },
} as const;

export type AccentKey = keyof typeof ACCENT;

const NUMERIC = /^(-?\d+(?:\.\d+)?)(.*)$/;

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export function KpiCard({
  label,
  value,
  sub,
  icon,
  accent = "jade",
  spark,
  delay = 0,
  alert,
}: {
  label: string;
  value: string;
  sub: ReactNode;
  icon: ReactNode;
  accent?: AccentKey;
  spark?: number[];
  delay?: number;
  alert?: "warning" | "critical";
}) {
  const a = ACCENT[accent];
  const parsed = NUMERIC.exec(value);
  const numeric = parsed ? parseFloat(parsed[1]) : null;
  const decimals = parsed ? (parsed[1].split(".")[1] ?? "").length : 0;
  const suffix = parsed?.[2] ?? "";

  const [displayNum, setDisplayNum] = useState(0);
  const lastNumeric = useRef(0);

  useEffect(() => {
    if (numeric === null) return;
    const from = lastNumeric.current;
    const start = performance.now();
    const DURATION = 1100;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min((now - start) / DURATION, 1);
      setDisplayNum(from + (numeric - from) * easeOutCubic(t));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        lastNumeric.current = numeric;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [numeric]);

  const display = numeric === null ? value : `${displayNum.toFixed(decimals)}${suffix}`;

  return (
    <TiltPanel className="group overflow-hidden" intensity={8}>
      <div
        className="anim-fade-up h-full"
        style={{
          animationDelay: `${delay}ms`,
        }}
      >
        <div className="gold-hairline relative p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="lux-eyebrow">{label}</p>
              <p
                className={cn(
                  "font-display mt-3 text-[3.75rem] font-semibold leading-none tracking-tight lg:text-[4.5rem]",
                  alert === "warning" && "lux-gold-text"
                )}
                style={
                  alert === "warning"
                    ? undefined
                    : {
                        color: a.hex,
                        textShadow: `0 0 30px ${a.hex}70, 0 0 80px ${a.hex}38`,
                      }
                }
              >
                {display}
              </p>
            </div>
            <div
              className={cn(
                "shine-sweep flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg transition-transform duration-500 group-hover:scale-110",
                a.chip,
                a.glow
              )}
            >
              <span className="icon-breathe">{icon}</span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2.5 text-sm font-medium text-hisense-soft/70">
            {alert === "critical" ? (
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-400" />
            ) : (
              <span className={cn("inline-block h-2 w-2 rounded-full", a.dot)} />
            )}
            {sub}
          </div>
          {spark && (
            <div className="mt-3 h-8 w-full">
              <svg viewBox="0 0 120 28" preserveAspectRatio="none" className="h-full w-full">
                <defs>
                  <linearGradient id={`spark-${label}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={a.hex} stopOpacity="0.5" />
                    <stop offset="100%" stopColor={a.hex} stopOpacity="0" />
                  </linearGradient>
                </defs>
                {(() => {
                  const max = Math.max(...spark);
                  const min = Math.min(...spark);
                  const pts = spark.map((v, i) => [
                    (i / (spark.length - 1)) * 120,
                    26 - ((v - min) / (max - min || 1)) * 24,
                  ]);
                  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
                  const area = `0,28 ${line} 120,28`;
                  return (
                    <>
                      <polygon points={area} fill={`url(#spark-${label})`} />
                      <polyline
                        points={line}
                        fill="none"
                        stroke={a.hex}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      <circle
                        cx={pts[pts.length - 1][0]}
                        cy={pts[pts.length - 1][1]}
                        r="2.2"
                        fill={a.hex}
                        stroke="#06151b"
                        strokeWidth="1"
                      />
                    </>
                  );
                })()}
              </svg>
            </div>
          )}
        </div>
      </div>
    </TiltPanel>
  );
}
