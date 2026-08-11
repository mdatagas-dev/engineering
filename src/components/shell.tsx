"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { muatDariBackend } from "@/lib/store";
import { cn } from "@/lib/utils";

const SIDEBAR_KEY = "eng_sidebar_collapsed";

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(SIDEBAR_KEY) === "1";
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    void muatDariBackend();
  }, []);

  const onToggle = () => {
    setCollapsed((c) => {
      localStorage.setItem(SIDEBAR_KEY, c ? "0" : "1");
      return !c;
    });
  };

  if (isLogin) {
    return (
      <div key={pathname} className="page-enter min-h-screen">
        {children}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        collapsed={collapsed}
        onToggle={onToggle}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <main
        className={cn(
          "flex-1 px-4 py-5 transition-[margin] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:px-6 lg:px-8 lg:py-8",
          collapsed ? "lg:ml-16" : "lg:ml-64"
        )}
      >
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Buka menu"
          className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-hisense/20 bg-obsidian-850/70 text-hisense-soft transition-colors hover:border-hisense/40 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div key={pathname} className="page-enter">
          {children}
        </div>
      </main>
    </div>
  );
}
