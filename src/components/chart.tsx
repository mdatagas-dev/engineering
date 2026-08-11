"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import "echarts-gl";

export type ChartOption = echarts.EChartsCoreOption;

function firstLineData(option: ChartOption): { data: unknown[]; yAxisIndex: number } | null {
  const series = (option as { series?: unknown[] | unknown }).series;
  if (!Array.isArray(series)) return null;
  for (const s of series) {
    const candidate = s as { type?: string; data?: unknown[]; yAxisIndex?: number };
    if (candidate.type === "line" && Array.isArray(candidate.data) && candidate.data.length >= 2) {
      return { data: candidate.data, yAxisIndex: candidate.yAxisIndex ?? 0 };
    }
  }
  return null;
}

export function Chart({
  option,
  className = "",
  height = 300,
}: {
  option: ChartOption;
  className?: string;
  height?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current, undefined, { renderer: "canvas" });
    chartRef.current = chart;
    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(ref.current);
    return () => {
      observer.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const series = ((option as { series?: unknown[] }).series ?? []) as {
      type?: string;
    }[];
    const hasBar = series.some((s) => s.type === "bar");

    const base = {
      animation: true,
      animationDuration: hasBar ? 1100 : 1400,
      animationDurationUpdate: 700,
      animationEasing: "cubicOut",
      animationEasingUpdate: "cubicInOut",
      animationDelay: hasBar ? (idx: number) => idx * 60 : undefined,
      animationDelayUpdate: hasBar ? (idx: number) => idx * 45 : undefined,
    } as ChartOption;

    chart.setOption({ ...base, ...option }, { notMerge: true, lazyUpdate: false });

    const line = firstLineData(option);
    if (!line || line.data.length < 2) return;

    let alive = true;
    let raf = 0;
    let start = performance.now();
    const CYCLE = 3200;

    const toXY = (idx: number, point: unknown): [number, number] => {
      if (Array.isArray(point)) return [Number(point[0]), Number(point[1])];
      return [idx, Number(point)];
    };

    const step = (now: number) => {
      if (!alive || document.hidden) return;
      const t = ((now - start) % CYCLE) / CYCLE;
      const n = line.data.length;
      const pos = t * (n - 1);
      const i0 = Math.floor(pos);
      const frac = pos - i0;
      const i1 = Math.min(i0 + 1, n - 1);
      const [x0, y0] = toXY(i0, line.data[i0]);
      const [x1, y1] = toXY(i1, line.data[i1]);
      const x = x0 + (x1 - x0) * frac;
      const y = y0 + (y1 - y0) * frac;
      chart.setOption(
        {
          series: [
            {
              id: "__flow_dot",
              type: "effectScatter",
              z: 10,
              symbol: "circle",
              symbolSize: 7,
              itemStyle: {
                color: "#00b3ac",
                shadowBlur: 14,
                shadowColor: "rgba(0,179,172,0.9)",
              },
              rippleEffect: { brushType: "stroke", scale: 3.2, period: 2.2 },
              animation: false,
              yAxisIndex: line.yAxisIndex,
              data: [[x, y]],
            },
          ],
        },
        { notMerge: false }
      );
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, [option]);

  return <div ref={ref} className={className} style={{ height }} />;
}
