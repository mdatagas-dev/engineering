"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Hexagon, KeyRound, User, Loader2, Lock } from "lucide-react";
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Gradasi bergerak pelan ala Microsoft */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(120deg, #00b3ac 0%, #3b82f6 25%, #8b5cf6 50%, #ec4899 75%, #00b3ac 100%)",
          backgroundSize: "300% 300%",
          animation: "gradient-shift 18s ease-in-out infinite",
        }}
      />
      <div className="absolute inset-0 bg-obsidian-950/70" />

      <div className="anim-fade-up relative z-10 w-full max-w-md px-4">
        <div className="rounded-2xl bg-white p-8 shadow-2xl sm:p-10">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center"
                style={{
                  background: "conic-gradient(from 210deg, #f25022, #7fba00, #00a4ef, #ffb900, #f25022)",
                  clipPath: "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)",
                }}
              >
                <div
                  className="flex h-9 w-9 items-center justify-center"
                  style={{
                    background: "conic-gradient(from 210deg, #f25022, #7fba00, #00a4ef, #ffb900, #f25022)",
                    clipPath: "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)",
                  }}
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white shadow">
                    <Hexagon className="h-4 w-4 text-neutral-700" strokeWidth={2.4} />
                  </div>
                </div>
              </div>
              <div className="text-left leading-tight">
                <p className="text-2xl font-semibold tracking-tight text-neutral-900">EPD</p>
                <p className="text-xs text-neutral-500">Engineering Performance Dashboard</p>
              </div>
            </div>
            <h1 className="text-2xl font-semibold text-neutral-900">{t("login.welcome")}</h1>
            <p className="mt-1 text-sm text-neutral-500">{t("login.subtitle")}</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                {t("login.username")}
              </label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t("login.usernamePlaceholder")}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-[#00b3ac] focus:ring-2 focus:ring-[#00b3ac]/30"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                {t("login.password")}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-[#00b3ac] focus:ring-2 focus:ring-[#00b3ac]/30"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#00b3ac] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#009a94] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="h-4 w-4" />
              )}
              {t("login.submit")}
            </button>
          </form>

          <div className="mt-8">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-neutral-400">
              {t("login.demo")}
            </p>
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.username}
                  onClick={() => fill(acc.username, acc.password)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-neutral-200 px-4 py-2.5 text-left transition-colors hover:border-[#00b3ac]/50 hover:bg-[#00b3ac]/5"
                >
                  <div>
                    <p className="font-mono text-sm text-neutral-800">{acc.username}</p>
                    <p className="text-xs text-neutral-400">{t(`role.${acc.role}`)} · {t(`role.desc.${acc.role}`)}</p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-[11px] capitalize",
                      acc.role === "admin" && "border-amber-400/50 bg-amber-50 text-amber-600",
                      acc.role === "engineer" && "border-[#00b3ac]/40 bg-[#00b3ac]/5 text-[#00857f]",
                      acc.role === "viewer" && "border-neutral-300 bg-neutral-50 text-neutral-500"
                    )}
                  >
                    {acc.role}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-neutral-400">
            {t("app.title")} · {t("login.security")}
          </p>
        </div>
      </div>
    </div>
  );
}
