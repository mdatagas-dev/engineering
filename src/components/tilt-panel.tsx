"use client";

import { useRef, type ReactNode, type MouseEvent } from "react";
import { cn } from "@/lib/utils";

export function TiltPanel({
  children,
  className = "",
  intensity = 10,
  glow = true,
}: {
  children: ReactNode;
  className?: string;
  intensity?: number;
  glow?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.setProperty("--ry", `${px * intensity}deg`);
    el.style.setProperty("--rx", `${-py * intensity}deg`);
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={cn("panel-3d tilt-3d", className)}
    >
      {glow && (
        <div
          className="pointer-events-none absolute inset-0 rounded-[1.25rem] opacity-0 transition-opacity duration-300"
          style={{
            background:
              "radial-gradient(600px 300px at var(--mx,50%) 0%, rgba(0,179,172,0.1), transparent 60%)",
          }}
        />
      )}
      {children}
    </div>
  );
}
