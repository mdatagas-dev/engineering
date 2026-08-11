import { NextRequest, NextResponse } from "next/server";
import { verifyJwt, signJwt, COOKIE_NAME, type Role } from "@/lib/auth";

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8101";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ user: null });
  const user = await verifyJwt(token);
  return NextResponse.json({ user });
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const role = String(body?.role ?? "") as Role;
  if (!["admin", "engineer", "viewer", "qc"].includes(role)) {
    return NextResponse.json({ error: "Role tidak valid" }, { status: 400 });
  }
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "Belum login" }, { status: 401 });
  const user = await verifyJwt(token);
  if (!user) return NextResponse.json({ error: "Sesi tidak valid" }, { status: 401 });

  try {
    const res = await fetch(`${BACKEND}/api/users/${encodeURIComponent(user.username)}/role`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ role }),
      cache: "no-store",
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { detail?: string };
      return NextResponse.json(
        { error: data.detail ?? "Gagal mengubah role" },
        { status: res.status }
      );
    }
  } catch {
    return NextResponse.json({ error: "Backend tidak terjangkau" }, { status: 500 });
  }

  const next = await signJwt({ sub: user.username, role });
  const resp = NextResponse.json({ ok: true, role });
  resp.cookies.set(COOKIE_NAME, next, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return resp;
}
