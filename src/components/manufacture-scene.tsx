"use client";

const GEAR_PATH =
  "M 24 6 a 18 18 0 0 1 15.6 9 l 3 -1.7 l 3.4 5.9 l -3 1.7 a 18 18 0 0 1 0 6.2 l 3 1.7 l -3.4 5.9 l -3 -1.7 a 18 18 0 0 1 -15.6 9 a 18 18 0 0 1 -15.6 -9 l -3 1.7 l -3.4 -5.9 l 3 -1.7 a 18 18 0 0 1 0 -6.2 l -3 -1.7 l 3.4 -5.9 l 3 1.7 a 18 18 0 0 1 15.6 -9 Z";

export function ManufactureScene() {
  return (
    <div className="manu-stage relative h-full w-full overflow-hidden">
      <div className="manu-scene relative h-full w-full">
        {/* grid 3D lantai */}
        <svg
          className="absolute inset-0 h-full w-full opacity-60"
          viewBox="0 0 400 300"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="lg-glow" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#00b3ac" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.15" />
            </linearGradient>
          </defs>
          {Array.from({ length: 12 }).map((_, i) => (
            <line
              key={`v${i}`}
              x1={i * 36}
              y1={0}
              x2={i * 36 - 120}
              y2={300}
              stroke="rgba(0,179,172,0.14)"
              strokeWidth="1"
            />
          ))}
          {Array.from({ length: 8 }).map((_, i) => (
            <line
              key={`h${i}`}
              x1={0}
              y1={i * 40}
              x2={400}
              y2={i * 40 - 120}
              stroke="rgba(0,179,172,0.12)"
              strokeWidth="1"
            />
          ))}
        </svg>

        {/* ===== KONVEYOR ===== */}
        <div className="absolute bottom-[16%] left-1/2 w-[78%] -translate-x-1/2">
          <div className="manu-conveyor h-3 w-full rounded-full border border-hisense/30 shadow-[0_0_20px_rgba(0,179,172,0.35)]" />
          <div className="relative mt-1 h-6">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="manu-product absolute top-0 h-5 w-5 rounded-md border border-hisense/60 bg-gradient-to-br from-hisense/40 to-cyan-500/20 shadow-hisense-glow"
                style={{
                  animation: `product-slide ${4.6 + i * 0.9}s linear ${i * 1.15}s infinite`,
                }}
              />
            ))}
          </div>
        </div>

        {/* ===== ROBOT ARM (kiri) ===== */}
        <div className="manu-arm absolute bottom-[24%] left-[8%] h-[38%] w-[34%]">
          <svg viewBox="0 0 120 140" className="h-full w-full drop-shadow-[0_0_18px_rgba(0,179,172,0.35)]">
            <line x1="60" y1="10" x2="60" y2="58" stroke="#22d3ee" strokeWidth="7" strokeLinecap="round" />
            <circle cx="60" cy="58" r="9" fill="#0d4d50" stroke="#22d3ee" strokeWidth="3" />
            <line x1="60" y1="58" x2="92" y2="96" stroke="#00b3ac" strokeWidth="6" strokeLinecap="round" />
            <g className="manu-arm-grab">
              <line x1="92" y1="96" x2="80" y2="128" stroke="#22d3ee" strokeWidth="5" strokeLinecap="round" />
              <line x1="92" y1="96" x2="104" y2="128" stroke="#22d3ee" strokeWidth="5" strokeLinecap="round" />
              <circle cx="80" cy="131" r="4" fill="#22d3ee" />
              <circle cx="104" cy="131" r="4" fill="#22d3ee" />
            </g>
            <rect x="42" y="0" width="36" height="14" rx="4" fill="#071c22" stroke="#00b3ac" strokeWidth="2" />
          </svg>
        </div>

        {/* ===== GEARS (kanan) ===== */}
        <div className="absolute right-[6%] top-[10%] h-28 w-28">
          <svg viewBox="0 0 48 48" className="manu-gear h-20 w-20 opacity-90">
            <path d={GEAR_PATH} fill="rgba(0,179,172,0.22)" stroke="#00b3ac" strokeWidth="2" />
            <circle cx="24" cy="24" r="7" fill="#0d4d50" stroke="#22d3ee" strokeWidth="2" />
          </svg>
        </div>
        <div className="absolute right-[16%] top-[26%] h-20 w-20">
          <svg viewBox="0 0 48 48" className="manu-gear-rev h-14 w-14 opacity-70">
            <path d={GEAR_PATH} fill="rgba(34,211,238,0.15)" stroke="#22d3ee" strokeWidth="2" />
            <circle cx="24" cy="24" r="7" fill="#0d4d50" stroke="#22d3ee" strokeWidth="2" />
          </svg>
        </div>

        {/* ===== HOLOGRAM PLATFORM (tengah-atas) ===== */}
        <div className="absolute left-1/2 top-[6%] h-32 w-40 -translate-x-1/2">
          <div className="absolute inset-0 rounded-2xl border border-hisense/30 bg-hisense/5" />
          <svg viewBox="0 0 160 64" className="absolute inset-x-2 top-2 opacity-90">
            {[0, 1, 2, 3].map((i) => (
              <rect
                key={i}
                x={12 + i * 34}
                y={44 - (i % 2 ? 26 : 14)}
                width="20"
                height={i % 2 ? 26 : 14}
                rx="3"
                fill="rgba(0,179,172,0.5)"
                className="manu-eq"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
            <polyline
              points="8,52 40,52 66,30 104,38 152,14"
              fill="none"
              stroke="#22d3ee"
              strokeWidth="2"
              className="manu-dash"
            />
          </svg>
          <div className="manu-scanline absolute inset-x-0 h-10 bg-gradient-to-b from-transparent via-cyan-300/20 to-transparent" />
        </div>

        {/* ===== SPARKS / partikel ===== */}
        {[
          { left: "12%", delay: "0s" },
          { left: "32%", delay: "0.9s" },
          { left: "55%", delay: "1.8s" },
          { left: "74%", delay: "0.4s" },
          { left: "88%", delay: "2.3s" },
        ].map((s, i) => (
          <span
            key={i}
            className="manu-spark absolute bottom-[28%] h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.9)]"
            style={{ left: s.left, animationDelay: s.delay }}
          />
        ))}

        {/* garis status atas */}
        <div className="absolute inset-x-0 top-0 flex items-center gap-2 px-4 py-3">
          <span className="live-dot" />
          <span className="font-cinzel text-[11px] uppercase tracking-[0.25em] text-hisense-soft/80">
            SYSTEM ONLINE
          </span>
          <span className="ml-auto font-mono text-[10px] text-hisense-soft/60">FAB-04 · RUNNING</span>
        </div>
      </div>
    </div>
  );
}
