import { NextRequest, NextResponse } from "next/server";
import { getUser, verifyPassword, signJwt, COOKIE_NAME, AUTH_MAX_AGE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const username = String(body?.username ?? "").trim();
  const password = String(body?.password ?? "");
  const user = await getUser(username);

  if (!user || !(await verifyPassword(password, user.salt, user.hash))) {
    return NextResponse.json({ error: "Username atau password salah" }, { status: 401 });
  }

  const token = await signJwt({ sub: username, role: user.role });

  const res = NextResponse.json({
    ok: true,
    username,
    role: user.role,
    token,
  });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: AUTH_MAX_AGE,
  });
  return res;
}