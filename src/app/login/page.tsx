"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, User, Loader2, Lock, Eye, EyeOff } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";
import { LogoIcon } from "@/components/logo";

const MANUFACTURE_QUOTES: { quote: string; author: string }[] = [
  { quote: "Kualitas bukanlah suatu tindakan, melainkan sebuah kebiasaan.", author: "Aristoteles" },
  { quote: "Kesempurnaan tidak dapat dicapai, tetapi jika kita mengejarnya, kita dapat mencapai keunggulan.", author: "Vince Lombardi" },
  { quote: "Kualitas yang sesungguhnya berarti melakukan yang benar, ketika tidak ada yang mengawasi.", author: "Henry Ford" },
  { quote: "Perbaikan terus-menerus lebih baik daripada kesempurnaan yang tertunda.", author: "Mark Twain" },
  { quote: "Cara terbaik untuk memprediksi masa depan adalah dengan menciptakannya.", author: "Peter Drucker" },
  { quote: "Kesederhanaan adalah kecanggihan tertinggi.", author: "Leonardo da Vinci" },
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
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [quoteIdx, setQuoteIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIdx((i) => (i + 1) % MANUFACTURE_QUOTES.length);
    }, 2 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

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

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Gradasi bergerak pelan */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(120deg, #0a2f33 0%, #123b49 20%, #1e2a5e 45%, #3b1e4e 70%, #4b2a63 85%, #0a2f33 100%)",
          backgroundSize: "300% 300%",
          animation: "gradient-shift 18s ease-in-out infinite",
        }}
      />
      <div className="absolute inset-0 bg-obsidian-950/45" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col lg:flex-row">
        {/* ===== KIRI: kata mutiara (lebih besar) ===== */}
        <div className="flex flex-[1.3] flex-col justify-center px-8 py-12 lg:px-16 xl:px-24">
          <div className="mb-12 flex items-center gap-4">
            <LogoIcon size="lg" />
            <div className="text-left leading-tight">
              <p className="text-3xl font-semibold tracking-tight text-white">EPD</p>
              <p className="text-sm text-white/70">Engineering Performance Dashboard</p>
            </div>
          </div>

          <blockquote className="max-w-2xl">
            <div key={quoteIdx} className="anim-fade-in">
              <p className="font-display text-4xl font-medium leading-snug text-white lg:text-5xl xl:text-[3.4rem]">
                “{MANUFACTURE_QUOTES[quoteIdx].quote}”
              </p>
              <footer className="mt-6 flex items-center gap-3">
                <span className="h-px w-12 bg-white/40" />
                <cite className="text-base text-white/80 not-italic">{MANUFACTURE_QUOTES[quoteIdx].author}</cite>
              </footer>
            </div>
            <div className="mt-8 flex items-center gap-2">
              {MANUFACTURE_QUOTES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setQuoteIdx(i)}
                  aria-label={`Kutipan ${i + 1}`}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    i === quoteIdx ? "w-8 bg-white" : "w-2 bg-white/30 hover:bg-white/50"
                  )}
                />
              ))}
              <span className="ml-2 font-mono text-xs text-white/40">
                {String(quoteIdx + 1).padStart(2, "0")}/{MANUFACTURE_QUOTES.length}
              </span>
            </div>
          </blockquote>
        </div>

        {/* ===== KANAN: form login (lebih ke kanan) ===== */}
        <div className="flex w-full items-center justify-end px-4 pb-12 lg:w-[500px] lg:pr-16 xl:pr-24">
          <div className="anim-fade-up w-full max-w-md">
            <div className="rounded-2xl bg-white p-8 shadow-2xl sm:p-10">
              <div className="mb-8">
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
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-neutral-300 bg-white py-2.5 pl-10 pr-11 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-[#00b3ac] focus:ring-2 focus:ring-[#00b3ac]/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      title={showPassword ? "Sembunyikan password" : "Lihat password"}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
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

              <p className="mt-8 text-center text-xs font-medium tracking-wide text-neutral-400">
                ENGINEERING · Role-Based Access Control · JWT Secure Session
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
