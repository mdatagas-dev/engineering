import { NextRequest, NextResponse } from "next/server";
import { verifyJwt, signJwt, setUserRole, COOKIE_NAME, type Role } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ user: null });
  const user = await verifyJwt(token);
  return NextResponse.json({ user });
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const role = String(body?.role ?? "") as Role;
  if (!["admin", "engineer", "viewer"].includes(role)) {
    return NextResponse.json({ error: "Role tidak valid" }, { status: 400 });
  }
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "Belum login" }, { status: 401 });
  const user = await verifyJwt(token);
  if (!user) return NextResponse.json({ error: "Sesi tidak valid" }, { status: 401 });
  await setUserRole(user.username, role);
  const next = await signJwt({ sub: user.username, role });
  const res = NextResponse.json({ ok: true, role });
  res.cookies.set(COOKIE_NAME, next, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return res;
}
