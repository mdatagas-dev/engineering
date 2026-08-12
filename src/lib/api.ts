function resolveApiBase(): string {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host && host !== "localhost" && host !== "127.0.0.1") {
      return `http://${host}:8101`;
    }
  }
  return "http://localhost:8101";
}

const API_BASE = resolveApiBase();

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
  category: string;
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

export async function clearMockData() {
  return json<{ cleared: boolean; [k: string]: number | boolean }>(`${API_BASE}/api/data/clear`, {
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

export async function downloadRawExport(filename = "raw-data-export.xlsx") {
  const res = await fetch(`${API_BASE}/api/raw-data/export`, { headers: authHeaders() });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { detail?: string }).detail ?? `HTTP ${res.status}`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadImportTemplate(filename = "template-import-raw-data.xlsx") {
  const res = await fetch(`${API_BASE}/api/impor-excel/template`, { headers: authHeaders() });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { detail?: string }).detail ?? `HTTP ${res.status}`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
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

export interface UserAccount {
  username: string;
  role: string;
}

export type UserRole = "admin" | "engineer" | "viewer" | "qc";

export async function fetchUsers(): Promise<UserAccount[]> {
  const res = await json<{ users: UserAccount[] }>(`${API_BASE}/api/users`);
  return res.users;
}

export async function tambahUser(data: { username: string; password: string; role: UserRole }) {
  return json<UserAccount>(`${API_BASE}/api/users`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function ubahRoleUser(username: string, role: UserRole) {
  return json<{ ok: boolean; username: string; role: string }>(
    `${API_BASE}/api/users/${encodeURIComponent(username)}/role`,
    { method: "PUT", body: JSON.stringify({ role }) }
  );
}

export async function resetPasswordUser(username: string, password: string) {
  return json<{ ok: boolean }>(`${API_BASE}/api/users/${encodeURIComponent(username)}/password`, {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function hapusUser(username: string) {
  return json<{ deleted: boolean; username: string }>(
    `${API_BASE}/api/users/${encodeURIComponent(username)}`,
    { method: "DELETE" }
  );
}
