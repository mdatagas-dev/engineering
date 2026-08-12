"use client";

import { useSyncExternalStore } from "react";
import { DAILY_RAW, type DailyRaw } from "./data";
import { fetchRawData, type RawDataRow } from "./api";

let rows: DailyRaw[] = [...DAILY_RAW];
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot() {
  return rows;
}

export function useRawRows(): DailyRaw[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function tambahBaris(row: DailyRaw) {
  rows = [...rows, row];
  listeners.forEach((cb) => cb());
}

export function simpanBaris(row: DailyRaw) {
  const idx = rows.findIndex(
    (r) => r.date === row.date && r.model === row.model && r.line === row.line
  );
  rows = idx >= 0 ? rows.map((r, i) => (i === idx ? row : r)) : [...rows, row];
  listeners.forEach((cb) => cb());
}

export function gantiBaris(newRows: DailyRaw[]) {
  rows = [...newRows];
  listeners.forEach((cb) => cb());
}

function konversiBaris(row: RawDataRow): DailyRaw {
  return {
    date: row.date,
    model: row.model,
    line: row.line,
    category: row.category,
    inputQty: row.input_qty,
    firstPassGoodQty: row.first_pass_good_qty,
    defectQty: row.defect_qty,
    plannedMinutes: row.planned_minutes,
    downtimeMinutes: row.downtime_minutes,
    targetCtSec: row.target_ct_sec,
    actualCtSec: row.actual_ct_sec,
    standardSetupMin: row.standard_setup_min,
    actualSetupMin: row.actual_setup_min,
  };
}

export async function muatDariBackend(): Promise<number> {
  try {
    const rows = await fetchRawData();
    gantiBaris(rows.map(konversiBaris));
    return rows.length;
  } catch {
    return 0;
  }
}
