import { NextRequest, NextResponse } from "next/server";
import { signJwt, COOKIE_NAME, AUTH_MAX_AGE } from "@/lib/auth";

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8101";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const username = String(body?.username ?? "").trim();
  const password = String(body?.password ?? "");

  let backendUser: { ok: boolean; username: string; role: string } | null = null;
  try {
    const res = await fetch(`${BACKEND}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      cache: "no-store",
    });
    if (res.ok) {
      backendUser = (await res.json()) as { ok: boolean; username: string; role: string };
    }
  } catch {
    backendUser = null;
  }

  if (!backendUser) {
    return NextResponse.json({ error: "Username atau password salah" }, { status: 401 });
  }

  const token = await signJwt({ sub: backendUser.username, role: backendUser.role });

  const resp = NextResponse.json({
    ok: true,
    username: backendUser.username,
    role: backendUser.role,
    token,
  });
  resp.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: AUTH_MAX_AGE,
  });
  return resp;
}
