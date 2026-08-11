"use client";

import { useCallback, useEffect, useState } from "react";
import { UserPlus, Trash2, RefreshCw, Users, KeyRound, CheckCircle2, AlertTriangle } from "lucide-react";
import { TiltPanel } from "@/components/tilt-panel";
import { PanelHeader } from "@/components/panel-header";
import { fetchUsers, tambahUser, ubahRoleUser, resetPasswordUser, hapusUser, type UserRole } from "@/lib/api";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

const ROLES: { value: UserRole; label: string; desc: string }[] = [
  { value: "admin", label: "Full Access", desc: "Semua fitur: input, impor, reset, kelola akun" },
  { value: "engineer", label: "Engineer", desc: "Input & impor data produksi" },
  { value: "qc", label: "Quality Control", desc: "Input defect quality & melihat dashboard" },
  { value: "viewer", label: "Viewer", desc: "Hanya melihat dashboard" },
];

const ROLE_STYLE: Record<string, string> = {
  admin: "border-gold-400/50 bg-gold-400/10 text-gold-300",
  engineer: "border-hisense/40 bg-hisense/10 text-hisense-soft",
  qc: "border-violet-400/50 bg-violet-400/10 text-violet-300",
  viewer: "border-neutral-400/40 bg-neutral-400/10 text-neutral-300",
};

export function UserManagementPanel() {
  const { t } = useI18n();
  const [users, setUsers] = useState<{ username: string; role: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("viewer");
  const [status, setStatus] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  const load = useCallback(() => {
    fetchUsers()
      .then((rows) => setUsers(rows))
      .catch((e) => setStatus({ type: "err", msg: (e as Error).message }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let alive = true;
    void load();
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => {
        if (alive) setCurrentUser(d.user?.username ?? null);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [load]);

  const add = async () => {
    const u = username.trim();
    if (u.length < 3) {
      setStatus({ type: "err", msg: "Username minimal 3 karakter" });
      return;
    }
    if (password.length < 4) {
      setStatus({ type: "err", msg: "Password minimal 4 karakter" });
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      await tambahUser({ username: u, password, role });
      setStatus({ type: "ok", msg: `Akun '${u}' berhasil dibuat` });
      setUsername("");
      setPassword("");
      setRole("viewer");
      load();
    } catch (e) {
      setStatus({ type: "err", msg: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const changeRole = async (u: string, r: UserRole) => {
    try {
      await ubahRoleUser(u, r);
      setUsers((prev) => prev.map((x) => (x.username === u ? { ...x, role: r } : x)));
    } catch (e) {
      setStatus({ type: "err", msg: (e as Error).message });
    }
  };

  const resetPw = async (u: string) => {
    const pw = window.prompt(`Password baru untuk '${u}' (min 4 karakter):`);
    if (!pw) return;
    try {
      await resetPasswordUser(u, pw);
      setStatus({ type: "ok", msg: `Password '${u}' direset` });
    } catch (e) {
      setStatus({ type: "err", msg: (e as Error).message });
    }
  };

  const remove = async (u: string) => {
    if (!window.confirm(`Hapus akun '${u}'?`)) return;
    try {
      await hapusUser(u);
      setUsers((prev) => prev.filter((x) => x.username !== u));
      setStatus({ type: "ok", msg: `Akun '${u}' dihapus` });
    } catch (e) {
      setStatus({ type: "err", msg: (e as Error).message });
    }
  };

  return (
    <TiltPanel className="anim-fade-up xl:col-span-2" intensity={3}>
      <PanelHeader icon={<Users className="h-4 w-4" />} title={t("settings.users")} subtitle={t("settings.usersSub")} />

      {/* form tambah */}
      <div className="space-y-4 p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-hisense-soft/80">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="mis. operator1"
              className="w-full rounded-xl border border-hisense/15 bg-obsidian-900/80 px-4 py-3 text-base text-hisense-soft outline-none transition-all placeholder:text-hisense-soft/35 focus:border-hisense/60"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-hisense-soft/80">Password</label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="min. 4 karakter"
              className="w-full rounded-xl border border-hisense/15 bg-obsidian-900/80 px-4 py-3 text-base text-hisense-soft outline-none transition-all placeholder:text-hisense-soft/35 focus:border-hisense/60"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-hisense-soft/80">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full appearance-none rounded-xl border border-hisense/15 bg-obsidian-900/80 px-4 py-3 text-base text-hisense-soft outline-none transition-all focus:border-hisense/60"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value} className="bg-obsidian-900">
                  {r.label} — {r.desc}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={add}
              disabled={saving}
              className="shine-sweep relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-hisense-bold via-hisense to-hisense-soft px-5 py-3 text-base font-bold text-obsidian-950 shadow-hisense-glow transition-all disabled:opacity-40"
            >
              <UserPlus className="h-5 w-5" /> Tambah Akun
            </button>
          </div>
        </div>

        {status && (
          <div
            className={cn(
              "flex items-start gap-2.5 rounded-xl border px-4 py-3 text-base",
              status.type === "ok"
                ? "border-hisense/30 bg-hisense/10 text-hisense-soft"
                : "border-gold-400/30 bg-gold-400/10 text-gold-300"
            )}
          >
            {status.type === "ok" ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-hisense" />
            ) : (
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-gold-400" />
            )}
            {status.msg}
          </div>
        )}

        {/* daftar akun */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-hisense/15 text-xs uppercase tracking-wider text-hisense-soft/75">
                <th className="pb-3 pr-4 font-semibold">Username</th>
                <th className="pb-3 pr-4 font-semibold">Role</th>
                <th className="pb-3 pr-4 font-semibold">Ubah Role</th>
                <th className="pb-3 pr-4 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-hisense-soft/50">Memuat…</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.username} className="border-b border-hisense/8 transition-colors hover:bg-hisense/5">
                    <td className="py-3 pr-4 font-mono text-hisense-soft">
                      {u.username}
                      {u.username === currentUser && (
                        <span className="ml-2 rounded-full border border-hisense/30 bg-hisense/10 px-2 py-0.5 text-[10px] text-hisense-soft">
                          Anda
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px] capitalize", ROLE_STYLE[u.role])}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <select
                        value={u.role}
                        onChange={(e) => changeRole(u.username, e.target.value as UserRole)}
                        className="rounded-lg border border-hisense/15 bg-obsidian-900/80 px-2 py-1.5 text-xs text-hisense-soft outline-none focus:border-hisense/60"
                      >
                        {ROLES.map((r) => (
                          <option key={r.value} value={r.value} className="bg-obsidian-900">
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => resetPw(u.username)}
                          title="Reset password"
                          className="rounded-lg border border-hisense/15 bg-obsidian-900/60 p-1.5 text-hisense-soft/80 transition-colors hover:border-hisense/40"
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => remove(u.username)}
                          disabled={u.username === currentUser}
                          title={u.username === currentUser ? "Tidak bisa hapus akun sendiri" : "Hapus akun"}
                          className="rounded-lg border border-red-500/25 bg-red-500/10 p-1.5 text-red-300 transition-colors hover:border-red-500/50 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-hisense-soft/50">Total {users.length} akun</p>
          <button
            onClick={load}
            className="flex items-center gap-2 rounded-lg border border-hisense/15 px-3 py-1.5 text-xs text-hisense-soft/70 transition-colors hover:border-hisense/40"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Muat ulang
          </button>
        </div>
      </div>
    </TiltPanel>
  );
}
