"use client";

import { useSyncExternalStore } from "react";
import { fetchDefects, tambahDefect as apiTambahDefect, hapusDefect as apiHapusDefect, type DefectRecord } from "./api";

let defects: DefectRecord[] = [];
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot() {
  return defects;
}

export function useDefects(): DefectRecord[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export async function muatDefects(): Promise<number> {
  try {
    defects = await fetchDefects();
    listeners.forEach((cb) => cb());
    return defects.length;
  } catch {
    return 0;
  }
}

export async function tambahDefect(data: Omit<DefectRecord, "id">): Promise<DefectRecord> {
  const saved = await apiTambahDefect(data);
  defects = [...defects, saved];
  listeners.forEach((cb) => cb());
  return saved;
}

export async function hapusDefect(id: number): Promise<void> {
  await apiHapusDefect(id);
  defects = defects.filter((d) => d.id !== id);
  listeners.forEach((cb) => cb());
}
