"use client";

import { useSyncExternalStore } from "react";
import { ISSUES, TOOLS, IMPROVEMENTS } from "./data";
import {
  fetchEngineering,
  tambahIssue as apiTambahIssue,
  updateIssue as apiUpdateIssue,
  hapusIssue as apiHapusIssue,
  tambahTool as apiTambahTool,
  hapusTool as apiHapusTool,
  tambahImprovement as apiTambahImprovement,
  hapusImprovement as apiHapusImprovement,
  type EngineeringIssue,
  type EngineeringTool,
  type EngineeringImprovement,
} from "./api";

export interface IssueItem {
  id: number;
  engId: string;
  title: string;
  line: string;
  owner: string;
  priority: "high" | "medium" | "low";
  status: "open" | "progress" | "closed";
  dueDate: string;
}

export interface ToolItem {
  id: number;
  name: string;
  plannedHours: number;
  actualAvailableHours: number;
}

export interface ImprovementItem {
  id: number;
  title: string;
  baseline: number;
  after: number;
  unit: string;
}

export interface EngState {
  issues: IssueItem[];
  tools: ToolItem[];
  improvements: ImprovementItem[];
}

export type NewIssue = Omit<IssueItem, "id" | "engId">;
export type NewTool = Omit<ToolItem, "id">;
export type NewImprovement = Omit<ImprovementItem, "id">;

function seed(): EngState {
  return {
    issues: ISSUES.map((i, idx) => ({
      id: -(idx + 1),
      engId: i.id,
      title: i.title,
      line: i.line,
      owner: i.owner,
      priority: i.priority,
      status: i.status,
      dueDate: i.dueDate,
    })),
    tools: TOOLS.map((t, idx) => ({ id: -(idx + 1), ...t })),
    improvements: IMPROVEMENTS.map((i, idx) => ({ id: -(idx + 1), ...i })),
  };
}

let state: EngState = seed();
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot() {
  return state;
}

function setState(next: EngState) {
  state = next;
  listeners.forEach((cb) => cb());
}

export function useEngineering(): EngState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

function konversiIssue(i: EngineeringIssue): IssueItem {
  return {
    id: i.id,
    engId: i.eng_id,
    title: i.title,
    line: i.line,
    owner: i.owner,
    priority: i.priority,
    status: i.status,
    dueDate: i.due_date,
  };
}

function konversiTool(t: EngineeringTool): ToolItem {
  return {
    id: t.id,
    name: t.name,
    plannedHours: t.planned_hours,
    actualAvailableHours: t.actual_available_hours,
  };
}

function konversiImprovement(i: EngineeringImprovement): ImprovementItem {
  return {
    id: i.id,
    title: i.title,
    baseline: i.baseline,
    after: i.after,
    unit: i.unit,
  };
}

export async function muatEngineering(): Promise<number> {
  try {
    const data = await fetchEngineering();
    setState({
      issues: data.issues.map(konversiIssue),
      tools: data.tools.map(konversiTool),
      improvements: data.improvements.map(konversiImprovement),
    });
    return data.issues.length;
  } catch {
    return 0;
  }
}

export async function tambahIssue(data: NewIssue) {
  const saved = await apiTambahIssue({
    title: data.title,
    line: data.line,
    owner: data.owner,
    priority: data.priority,
    status: data.status,
    due_date: data.dueDate,
  });
  setState({ ...state, issues: [...state.issues, konversiIssue(saved)] });
}

export async function ubahStatusIssue(id: number, status: IssueItem["status"]) {
  const saved = await apiUpdateIssue(id, { status });
  setState({
    ...state,
    issues: state.issues.map((i) => (i.id === id ? konversiIssue(saved) : i)),
  });
}

export async function hapusIssue(id: number) {
  await apiHapusIssue(id);
  setState({ ...state, issues: state.issues.filter((i) => i.id !== id) });
}

export async function tambahTool(data: NewTool) {
  const saved = await apiTambahTool({
    name: data.name,
    planned_hours: data.plannedHours,
    actual_available_hours: data.actualAvailableHours,
  });
  setState({ ...state, tools: [...state.tools, konversiTool(saved)] });
}

export async function hapusTool(id: number) {
  await apiHapusTool(id);
  setState({ ...state, tools: state.tools.filter((t) => t.id !== id) });
}

export async function tambahImprovement(data: NewImprovement) {
  const saved = await apiTambahImprovement(data);
  setState({
    ...state,
    improvements: [...state.improvements, konversiImprovement(saved)],
  });
}

export async function hapusImprovement(id: number) {
  await apiHapusImprovement(id);
  setState({
    ...state,
    improvements: state.improvements.filter((i) => i.id !== id),
  });
}
