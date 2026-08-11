"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import "echarts-gl";

export type ChartOption = echarts.EChartsCoreOption;

const FLOW_INTERVAL = 2600;

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

    const base = {
      animation: true,
      animationDuration: 1500,
      animationDurationUpdate: 600,
      animationEasing: "cubicOut",
    } as ChartOption;

    chart.setOption({ ...base, ...option }, { notMerge: true, lazyUpdate: false });

    const line = firstLineData(option);
    if (!line) return;

    let idx = 0;
    let alive = true;
    const tick = () => {
      if (!alive || document.hidden) return;
      const point = line.data[idx % line.data.length];
      const [x, y] = Array.isArray(point) ? point : [idx % line.data.length, point];
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
                color: "#00d6c9",
                shadowBlur: 14,
                shadowColor: "rgba(0,214,201,0.9)",
              },
              rippleEffect: { brushType: "stroke", scale: 3.2, period: 2.2 },
              yAxisIndex: line.yAxisIndex,
              data: [[x, y]],
            },
          ],
        },
        { notMerge: false }
      );
      idx += 1;
    };
    tick();
    const timer = setInterval(tick, FLOW_INTERVAL);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [option]);

  return <div ref={ref} className={className} style={{ height }} />;
}
