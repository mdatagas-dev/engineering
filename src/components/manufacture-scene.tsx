"use client";

function Stars() {
  const stars = [
    [6, 12], [14, 8], [22, 18], [31, 6], [40, 14], [49, 9], [57, 17], [66, 7],
    [74, 13], [83, 5], [91, 15], [96, 9], [26, 28], [60, 26], [88, 24], [44, 22],
  ] as const;
  return (
    <>
      {stars.map(([x, y], i) => (
        <span
          key={i}
          className="anime-star absolute rounded-full bg-cyan-200"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            width: i % 3 === 0 ? 3 : 2,
            height: i % 3 === 0 ? 3 : 2,
            boxShadow: "0 0 8px rgba(165,243,252,0.9)",
            animationDelay: `${(i * 0.41) % 3.4}s`,
          }}
        />
      ))}
    </>
  );
}

function Skyline({ className, windows }: { className: string; windows: [number, number, number][] }) {
  return (
    <svg viewBox="0 0 400 160" preserveAspectRatio="none" className={`absolute inset-x-0 bottom-0 h-1/2 w-full ${className}`}>
      <path
        d="M0 160 V110 L18 96 V84 H34 V110 L52 102 V70 H70 V102 L88 88 V58 H102 V88 L118 96 V120 L138 84 H154 V120 L172 104 V74 H188 V104 L206 92 V48 H222 V92 L240 104 V120 L260 72 H276 V120 L294 96 V66 H312 V96 L330 110 V130 L352 84 H368 V130 L384 118 V160 Z"
        fill="currentColor"
      />
      {windows.map(([x, y, d], i) => (
        <rect
          key={i}
          x={x}
          y={y}
          width="5"
          height="7"
          rx="1"
          fill="rgba(252,211,77,0.85)"
          className="anime-window"
          style={{ animationDelay: `${d}s` }}
        />
      ))}
    </svg>
  );
}

export function ManufactureScene() {
  return (
    <div className="anime-stage absolute inset-0">
      {/* langit dusk anime */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f2c] via-[#16245a] to-[#4b2a63]" />
      <div
        className="anime-sun absolute right-[16%] top-[14%] h-40 w-40 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,214,150,0.95) 0%, rgba(251,146,60,0.55) 40%, rgba(236,72,153,0.28) 62%, transparent 72%)",
          boxShadow: "0 0 90px 30px rgba(251,146,60,0.35), 0 0 40px 10px rgba(236,72,153,0.3)",
        }}
      />

      <Stars />

      {/* awan bergerak */}
      <div className="anime-cloud absolute top-[8%] h-6 w-40 rounded-full bg-white/10 blur-md" style={{ animationDuration: "52s" }} />
      <div className="anime-cloud absolute top-[20%] h-8 w-64 rounded-full bg-white/[0.07] blur-lg" style={{ animationDuration: "78s", animationDelay: "-30s" }} />
      <div className="anime-cloud absolute top-[30%] h-5 w-48 rounded-full bg-fuchsia-300/[0.08] blur-md" style={{ animationDuration: "64s", animationDelay: "-12s" }} />

      {/* gunung paralaks (jauh) */}
      <svg viewBox="0 0 400 200" preserveAspectRatio="none" className="absolute inset-x-0 bottom-[24%] h-[38%] w-full text-[#1d1742]">
        <path d="M0 200 L0 130 L60 78 L118 122 L172 60 L232 118 L300 72 L360 120 L400 96 L400 200 Z" fill="currentColor" />
      </svg>
      <svg viewBox="0 0 400 200" preserveAspectRatio="none" className="absolute inset-x-0 bottom-[12%] h-[42%] w-full text-[#120f30]">
        <path d="M0 200 L0 150 L52 110 L104 148 L160 92 L226 150 L288 108 L344 152 L400 120 L400 200 Z" fill="currentColor" />
      </svg>

      {/* skyline pabrik (dekat) dengan jendela menyala */}
      <div className="absolute inset-x-0 bottom-[4%] h-[26%] w-full text-[#0a0820]">
        <Skyline
          className="text-[#0a0820]"
          windows={[
            [20, 70, 0], [26, 70, 1.2], [60, 60, 0.6], [66, 60, 2.1],
            [110, 74, 1.5], [116, 74, 0.3], [150, 62, 2.4], [156, 62, 0.9],
            [198, 52, 1.8], [204, 52, 0.5], [258, 70, 2.9], [264, 70, 1.1],
            [300, 58, 0.2], [306, 58, 1.7], [342, 78, 2.2], [348, 78, 0.8],
          ]}
        />
      </div>

      {/* cerobong asap */}
      <div className="absolute bottom-[9%] left-[12%] h-16 w-3 bg-[#0a0820]" style={{ clipPath: "polygon(0 0, 100% 0, 78% 100%, 22% 100%)" }} />
      <span className="anime-smoke absolute bottom-[19%] left-[12.4%] h-5 w-5 rounded-full bg-cyan-200/30 blur-[3px]" style={{ animationDelay: "0s" }} />
      <span className="anime-smoke absolute bottom-[19%] left-[13%] h-4 w-4 rounded-full bg-cyan-100/25 blur-[3px]" style={{ animationDelay: "1.6s" }} />
      <div className="absolute bottom-[8%] right-[16%] h-14 w-2.5 bg-[#0a0820]" style={{ clipPath: "polygon(0 0, 100% 0, 80% 100%, 20% 100%)" }} />
      <span className="anime-smoke absolute bottom-[16%] right-[16.3%] h-4 w-4 rounded-full bg-fuchsia-200/25 blur-[3px]" style={{ animationDelay: "0.9s" }} />

      {/* drone melintas + jejak */}
      <div className="anime-drone absolute top-0 left-0 z-10">
        <svg width="64" height="30" viewBox="0 0 64 30">
          <path className="anime-trail" d="M 64 15 L -80 15" stroke="rgba(34,211,238,0.55)" strokeWidth="2" />
          <path d="M 8 15 L 26 15 L 30 8 L 56 8 L 62 15 L 56 22 L 30 22 L 26 15 Z" fill="#0d4d50" stroke="#22d3ee" strokeWidth="1.6" />
          <rect x="26" y="11" width="26" height="8" rx="2" fill="#071c22" stroke="#22d3ee" strokeWidth="1" />
          <circle cx="20" cy="15" r="2.4" fill="#fde68a" />
        </svg>
      </div>

      {/* speed lines ala anime */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 opacity-40">
        {[12, 38, 64, 88].map((y, i) => (
          <span
            key={i}
            className="anime-speedline absolute h-[2px] w-24 rounded-full bg-cyan-100"
            style={{ top: `${y}%`, animationDelay: `${i * 0.4}s` }}
          />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 opacity-40">
        {[20, 46, 72, 94].map((y, i) => (
          <span
            key={i}
            className="anime-speedline absolute h-[2px] w-24 rounded-full bg-cyan-100"
            style={{ top: `${y}%`, animationDelay: `${i * 0.35}s` }}
          />
        ))}
      </div>

      {/* ember naik */}
      {[
        { left: "8%", delay: "0s", sway: "16px" },
        { left: "24%", delay: "2.1s", sway: "-18px" },
        { left: "42%", delay: "4.4s", sway: "14px" },
        { left: "61%", delay: "1.3s", sway: "-22px" },
        { left: "78%", delay: "3.2s", sway: "18px" },
        { left: "92%", delay: "5.1s", sway: "-12px" },
      ].map((e, i) => (
        <span
          key={i}
          className="anime-ember absolute bottom-[4%] h-1.5 w-1.5 rounded-full bg-orange-300 shadow-[0_0_12px_rgba(251,146,60,0.95)]"
          style={{ left: e.left, animationDelay: e.delay, ["--sway" as string]: e.sway }}
        />
      ))}

      {/* ground scan bawah */}
      <div className="anime-ground absolute inset-x-0 bottom-0 h-[4%] opacity-40" />
    </div>
  );
}
