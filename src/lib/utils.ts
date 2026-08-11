import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPct(v: number, digits = 1) {
  return `${v.toFixed(digits)}%`;
}

export function formatMin(v: number) {
  return `${v.toFixed(0)} min`;
}

export function formatSec(v: number) {
  return `${v.toFixed(v % 1 === 0 ? 0 : 1)} sec`;
}
