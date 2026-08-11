"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
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
      <Sidebar collapsed={collapsed} onToggle={onToggle} />
      <main
        className={cn(
          "flex-1 px-8 py-8 transition-[margin] duration-300",
          collapsed ? "ml-16" : "ml-64"
        )}
      >
        <div key={pathname} className="page-enter">
          {children}
        </div>
      </main>
    </div>
  );
}
