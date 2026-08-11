"use client";

import { useEffect, useState } from "react";
import { Maximize, Minimize } from "lucide-react";
import { DashboardView } from "@/components/dashboard-view";
import { muatDariBackend } from "@/lib/store";
import { muatEngineering } from "@/lib/store-engineering";
import { useI18n } from "@/lib/i18n/provider";

const REFRESH_MS = 60000;

export default function DisplayPage() {
  const { t } = useI18n();
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const muat = () => {
      void muatDariBackend();
      void muatEngineering();
    };
    muat();
    const id = setInterval(muat, REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void document.documentElement.requestFullscreen();
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between gap-4 px-6 pt-5 sm:px-8">
        <h1 className="font-display text-hisense-gradient text-3xl font-semibold tracking-wide text-shadow-luxe lg:text-4xl">
          {t("dash.title")}
        </h1>
        <button
          onClick={toggleFullscreen}
          aria-label="Fullscreen"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-hisense/25 bg-obsidian-850/70 text-hisense-soft transition-colors hover:border-hisense/40"
        >
          {fullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
        </button>
      </header>
      <div className="flex-1 px-4 py-5 sm:px-8 lg:py-6">
        <DashboardView periode={30} animFrom={100} />
      </div>
    </div>
  );
}
