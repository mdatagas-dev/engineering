"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Hexagon, KeyRound, User, Loader2, Lock } from "lucide-react";
import { type Role } from "@/lib/auth";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";
import { ManufactureScene } from "@/components/manufacture-scene";
import { SceneBoundary } from "@/components/scene-boundary";

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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="aurora-bg" />
      <div className="grid-overlay" />

      {/* Scene 3D manufacturing — full screen background */}
      <div className="pointer-events-none absolute inset-0">
        <SceneBoundary>
          <ManufactureScene />
        </SceneBoundary>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-obsidian-950/60 via-transparent to-obsidian-950/80" />

      {/* Brand overlay kiri-atas */}
      <div className="pointer-events-none absolute left-6 top-6 z-10 flex items-center gap-3">
        <div className="relative">
          <div className="glow-ring absolute -inset-2 animate-pulse-glow opacity-60" />
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-hisense to-obsidian-700 shadow-hisense-glow">
            <Hexagon className="h-6 w-6 text-obsidian-950" strokeWidth={2.4} />
          </div>
        </div>
        <div>
          <p className="font-cinzel text-sm uppercase tracking-[0.18em] text-hisense-soft">{t("app.title")}</p>
          <p className="text-[11px] text-hisense-soft/60">{t("app.subtitle")}</p>
        </div>
      </div>

      {/* Form melayang di tengah */}
      <div className="anim-fade-up relative z-10 w-full max-w-md">
        <div className="glass-lux p-8 sm:p-10">
          <div className="mb-8">
            <p className="lux-eyebrow mb-2.5">{t("app.title")}</p>
            <h1 className="font-display text-hisense-gradient text-4xl font-bold text-shadow-luxe lg:text-5xl">{t("login.welcome")}</h1>
            <p className="mt-1.5 text-sm text-hisense-soft/75">{t("login.subtitle")}</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-hisense-soft/60">
                    {t("login.username")}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-hisense-soft/40" />
                    <input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={t("login.usernamePlaceholder")}
                      className="w-full rounded-xl border border-hisense/15 bg-obsidian-900/80 py-3 pl-10 pr-4 text-sm text-hisense-soft outline-none transition-all placeholder:text-hisense-soft/30 focus:border-hisense/60 focus:shadow-[0_0_20px_rgba(0,179,172,0.15)]"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-hisense-soft/60">
                    {t("login.password")}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-hisense-soft/40" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-hisense/15 bg-obsidian-900/80 py-3 pl-10 pr-4 text-sm text-hisense-soft outline-none transition-all placeholder:text-hisense-soft/30 focus:border-hisense/60 focus:shadow-[0_0_20px_rgba(0,179,172,0.15)]"
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
                  className="group shine-sweep relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-hisense-bold via-hisense to-hisense-soft px-6 py-3.5 text-sm font-bold text-obsidian-950 shadow-hisense-glow transition-all hover:shadow-hisense-glow disabled:cursor-not-allowed disabled:opacity-40"
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
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-hisense-soft/40">
                  {t("login.demo")}
                </p>
                <div className="space-y-2">
                  {DEMO_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.username}
                      onClick={() => fill(acc.username, acc.password)}
                      className={cn(
                        "gold-hairline flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-left transition-all",
                        acc.role === "admin"
                          ? "border-hisense/10 bg-obsidian-900/50 hover:border-gold-400/40 hover:bg-gold-400/5"
                          : "border-hisense/10 bg-obsidian-900/50 hover:border-hisense/40 hover:bg-hisense/5"
                      )}
                    >
                      <div>
                        <p className="font-mono text-xs text-hisense-soft">{acc.username}</p>
                        <p className="text-[10px] text-hisense-soft/40">{t(`role.${acc.role}`)} · {t(`role.desc.${acc.role}`)}</p>
                      </div>
                      <span
                        className={cn(
                          "rounded-full border px-2.5 py-0.5 text-[10px] capitalize",
                          acc.role === "admin" && "border-gold-400/30 bg-gold-400/10 text-gold-300",
                          acc.role === "engineer" && "border-hisense/30 bg-hisense/10 text-hisense-soft",
                          acc.role === "viewer" && "border-hisense-faint bg-hisense/10 text-hisense-soft"
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
  );
}
