"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, UserCircle } from "lucide-react";
import type { Role } from "@/lib/auth";

const ROLE_COLOR: Record<Role, string> = {
  admin: "text-gold-300",
  engineer: "text-jade-300",
  viewer: "text-teal-300",
};

export function UserSession() {
  const [user, setUser] = useState<{ username: string; role: Role } | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .catch(() => setUser(null));
  }, [pathname]);

  if (!user) return null;

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.localStorage.removeItem("eng_api_token");
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="mt-4 flex items-center justify-between gap-2 rounded-2xl border border-jade-400/15 bg-obsidian-850/70 px-4 py-3">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-jade-500/30 to-obsidian-700 text-jade-300">
          <UserCircle className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-medium text-jade-200">{user.username}</p>
          <p className={`text-[10px] capitalize ${ROLE_COLOR[user.role]}`}>{user.role}</p>
        </div>
      </div>
      <button
        onClick={logout}
        title="Keluar"
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-jade-400/15 text-jade-300/60 transition-all hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
