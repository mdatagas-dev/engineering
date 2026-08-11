"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Hexagon, KeyRound, User, Loader2, Lock, ShieldCheck } from "lucide-react";
import { type Role } from "@/lib/auth";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

const DEMO_ACCOUNTS: { username: string; password: string; role: Role }[] = [
  { username: "admin", password: "admin123", role: "admin" },
  { username: "engineer", password: "engineer123", role: "engineer" },
  { username: "viewer", password: "viewer123", role: "viewer" },
];

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/";
  const { t } = useI18n();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? t("login.error"));
        setLoading(false);
        return;
      }
      const data = await res.json().catch(() => null);
      if (!data?.token) {
        setError(t("login.error"));
        setLoading(false);
        return;
      }
      window.localStorage.setItem("eng_api_token", data.token);
      router.push(next);
      router.refresh();
    } catch {
      setError(t("login.errorNetwork"));
      setLoading(false);
    }
  };

  const fill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError("");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <div className="aurora-bg" />
      <div className="grid-overlay" />

      <div className="anim-fade-up w-full max-w-4xl">
        <div className="grid overflow-hidden rounded-3xl border border-jade-400/15 bg-obsidian-900/70 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)] backdrop-blur-xl">
          <div className="grid md:grid-cols-2">
            <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-jade-600/20 via-obsidian-850 to-obsidian-900 p-10 md:flex">
              <div className="relative z-10">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="glow-ring absolute -inset-2 animate-pulse-glow opacity-60" />
                    <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-jade-500 to-obsidian-700 shadow-lg shadow-jade-500/30">
                      <Hexagon className="h-6 w-6 text-obsidian-950" strokeWidth={2.4} />
                    </div>
                  </div>
                  <div>
                    <p className="font-display text-sm font-bold tracking-wide text-jade-300">{t("app.title")}</p>
                    <p className="text-[11px] text-jade-300/60">{t("app.subtitle")}</p>
                  </div>
                </div>
              </div>

              <div className="relative z-10">
                <p className="font-display jade-grad-text text-3xl font-bold leading-snug text-glow">
                  {t("login.tagline1")}
                  <br />
                  {t("login.tagline2")}
                </p>
                <p className="mt-4 max-w-sm text-sm leading-relaxed text-jade-300/60">
                  {t("login.taglineDesc")}
                </p>
                <div className="mt-8 space-y-3">
                  {[t("nav.process"), t("nav.quality"), t("nav.engineering")].map((p) => (
                    <div key={p} className="flex items-center gap-3 text-xs text-jade-300/70">
                      <ShieldCheck className="h-4 w-4 text-jade-400" />
                      {p}
                    </div>
                  ))}
                </div>
              </div>

              <p className="relative z-10 text-[11px] text-jade-300/30">
                {t("login.security")}
              </p>
            </div>

            <div className="p-6 sm:p-10">
              <div className="mb-8">
                <h1 className="font-display jade-grad-text text-2xl font-bold text-glow">{t("login.welcome")}</h1>
                <p className="mt-1.5 text-sm text-jade-300/50">{t("login.subtitle")}</p>
              </div>

              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-jade-300/60">
                    {t("login.username")}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-jade-300/40" />
                    <input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={t("login.usernamePlaceholder")}
                      className="w-full rounded-xl border border-jade-400/15 bg-obsidian-900/80 py-3 pl-10 pr-4 text-sm text-jade-100 outline-none transition-all placeholder:text-jade-300/30 focus:border-jade-400/60 focus:shadow-[0_0_20px_rgba(0,214,201,0.15)]"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-jade-300/60">
                    {t("login.password")}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-jade-300/40" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-jade-400/15 bg-obsidian-900/80 py-3 pl-10 pr-4 text-sm text-jade-100 outline-none transition-all placeholder:text-jade-300/30 focus:border-jade-400/60 focus:shadow-[0_0_20px_rgba(0,214,201,0.15)]"
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !username || !password}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-jade-500 to-jade-600 px-6 py-3.5 text-sm font-bold text-obsidian-950 shadow-lg shadow-jade-500/30 transition-all hover:shadow-jade-500/50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <KeyRound className="h-4 w-4 transition-transform group-hover:scale-110" />
                  )}
                  {t("login.submit")}
                </button>
              </form>

              <div className="mt-8">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-jade-300/40">
                  {t("login.demo")}
                </p>
                <div className="space-y-2">
                  {DEMO_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.username}
                      onClick={() => fill(acc.username, acc.password)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-left transition-all",
                        "border-jade-400/10 bg-obsidian-900/50 hover:border-jade-400/35 hover:bg-jade-500/5"
                      )}
                    >
                      <div>
                        <p className="font-mono text-xs text-jade-200">{acc.username}</p>
                        <p className="text-[10px] text-jade-300/40">{t(`role.${acc.role}`)} · {t(`role.desc.${acc.role}`)}</p>
                      </div>
                      <span
                        className={cn(
                          "rounded-full border px-2.5 py-0.5 text-[10px] capitalize",
                          acc.role === "admin" && "border-gold-400/30 bg-gold-400/10 text-gold-300",
                          acc.role === "engineer" && "border-jade-400/30 bg-jade-500/10 text-jade-300",
                          acc.role === "viewer" && "border-teal-400/30 bg-teal-400/10 text-teal-300"
                        )}
                      >
                        {acc.role}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
