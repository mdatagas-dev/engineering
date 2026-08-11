const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8101";

const TOKEN_KEY = "eng_api_token";

function authHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = window.localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface RawDataRow {
  date: string;
  model: string;
  line: string;
  input_qty: number;
  first_pass_good_qty: number;
  defect_qty: number;
  planned_minutes: number;
  downtime_minutes: number;
  target_ct_sec: number;
  actual_ct_sec: number;
  standard_setup_min: number;
  actual_setup_min: number;
}

export interface KpiResponse {
  fpy: number;
  oee: number;
  line_balance: number;
  setup_achievement: number;
  issue_closure: number;
  [key: string]: number;
}

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...authHeaders(), ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { detail?: string }).detail ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchRawData(): Promise<RawDataRow[]> {
  const res = await json<{ total_rows: number; rows: RawDataRow[] }>(`${API_BASE}/api/raw-data`);
  return res.rows;
}

export async function postRawData(row: RawDataRow) {
  return json<{ saved: boolean; total_rows: number; kpi: KpiResponse }>(
    `${API_BASE}/api/raw-data`,
    { method: "POST", body: JSON.stringify(row) }
  );
}

export async function resetRawData() {
  return json<{ reset: boolean; total_rows: number }>(`${API_BASE}/api/raw-data/reset`, {
    method: "POST",
  });
}

export async function uploadExcel(file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/api/impor-excel`, {
    method: "POST",
    headers: authHeaders(),
    body: form,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { detail?: string }).detail ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<{
    total_rows: number;
    preview: RawDataRow[];
    columns: string[];
    warnings: string[];
  }>;
}

export async function commitExcel() {
  return json<{ saved: number; total_rows: number; kpi: KpiResponse }>(
    `${API_BASE}/api/impor-excel/commit`,
    { method: "POST" }
  );
}

export interface EngineeringIssue {
  id: number;
  eng_id: string;
  title: string;
  line: string;
  owner: string;
  priority: "high" | "medium" | "low";
  status: "open" | "progress" | "closed";
  due_date: string;
}

export interface EngineeringTool {
  id: number;
  name: string;
  planned_hours: number;
  actual_available_hours: number;
}

export interface EngineeringImprovement {
  id: number;
  title: string;
  baseline: number;
  after: number;
  unit: string;
}

export interface EngineeringData {
  issues: EngineeringIssue[];
  tools: EngineeringTool[];
  improvements: EngineeringImprovement[];
}

export interface DefectRecord {
  id: number;
  date: string;
  line: string;
  model: string;
  defect_type: string;
  qty: number;
}

export async function fetchEngineering(): Promise<EngineeringData> {
  return json<EngineeringData>(`${API_BASE}/api/engineering`);
}

export async function tambahIssue(data: Omit<EngineeringIssue, "id" | "eng_id">) {
  return json<EngineeringIssue>(`${API_BASE}/api/engineering/issues`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateIssue(id: number, patch: Partial<EngineeringIssue>) {
  return json<EngineeringIssue>(`${API_BASE}/api/engineering/issues/${id}`, {
    method: "PUT",
    body: JSON.stringify(patch),
  });
}

export async function hapusIssue(id: number) {
  return json<{ deleted: boolean; id: number }>(`${API_BASE}/api/engineering/issues/${id}`, {
    method: "DELETE",
  });
}

export async function tambahTool(data: Omit<EngineeringTool, "id">) {
  return json<EngineeringTool>(`${API_BASE}/api/engineering/tools`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateTool(id: number, patch: Partial<EngineeringTool>) {
  return json<EngineeringTool>(`${API_BASE}/api/engineering/tools/${id}`, {
    method: "PUT",
    body: JSON.stringify(patch),
  });
}

export async function hapusTool(id: number) {
  return json<{ deleted: boolean; id: number }>(`${API_BASE}/api/engineering/tools/${id}`, {
    method: "DELETE",
  });
}

export async function tambahImprovement(data: Omit<EngineeringImprovement, "id">) {
  return json<EngineeringImprovement>(`${API_BASE}/api/engineering/improvements`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function hapusImprovement(id: number) {
  return json<{ deleted: boolean; id: number }>(`${API_BASE}/api/engineering/improvements/${id}`, {
    method: "DELETE",
  });
}

export async function fetchDefects(): Promise<DefectRecord[]> {
  const res = await json<{ total: number; rows: DefectRecord[] }>(`${API_BASE}/api/quality/defects`);
  return res.rows;
}

export async function tambahDefect(data: Omit<DefectRecord, "id">) {
  return json<DefectRecord>(`${API_BASE}/api/quality/defects`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function hapusDefect(id: number) {
  return json<{ deleted: boolean; id: number }>(`${API_BASE}/api/quality/defects/${id}`, {
    method: "DELETE",
  });
}
