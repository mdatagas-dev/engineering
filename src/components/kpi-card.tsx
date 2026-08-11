"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { TiltPanel } from "@/components/tilt-panel";

const ACCENT = {
  jade: "from-hisense to-hisense-bold text-hisense-soft shadow-hisense/40",
  gold: "from-gold-300 to-gold-500 text-gold-300 shadow-gold-500/30",
  teal: "from-hisense-soft to-hisense-bold text-hisense-soft shadow-hisense/40",
  emerald: "from-hisense-soft to-hisense-bold text-hisense-soft shadow-hisense-bold/40",
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
    const DURATION = 1000;
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
        <div className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-hisense-soft/60">
                {label}
              </p>
              <p
                className={`text-hisense-gradient font-display mt-3 text-4xl font-bold tracking-tight text-glow ${
                  alert === "warning" ? "gold-grad-text" : ""
                }`}
              >
                {display}
              </p>
            </div>
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${a} shadow-lg transition-transform duration-500 group-hover:scale-105`}
            >
              <span className="icon-breathe">{icon}</span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-hisense-soft/55">
            {alert === "critical" ? (
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
            ) : (
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-hisense" />
            )}
            {sub}
          </div>
          {spark && (
            <div className="mt-3 h-8 w-full">
              <svg viewBox="0 0 120 28" preserveAspectRatio="none" className="h-full w-full">
                <defs>
                  <linearGradient id={`spark-${label}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00b3ac" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#00b3ac" stopOpacity="0" />
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
                        stroke="#00b3ac"
                        strokeWidth="1.5"
                        strokeLinecap="round"
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
