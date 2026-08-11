export const CHART_PALETTE = [
  "#22d3ee",
  "#a78bfa",
  "#fbbf24",
  "#fb7185",
  "#34d399",
  "#60a5fa",
  "#fb923c",
  "#f472b6",
  "#4ade80",
  "#c084fc",
];

export const KPI_COLORS = {
  fpy: "#22d3ee",
  oee: "#34d399",
  lineBalance: "#a78bfa",
  setupTime: "#fbbf24",
  issueClosure: "#fb7185",
  cycle: "#60a5fa",
  quality: "#f472b6",
  engineering: "#c084fc",
} as const;

export function kpiHex(key: keyof typeof KPI_COLORS): string {
  return KPI_COLORS[key];
}
