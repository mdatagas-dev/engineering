import { NextRequest, NextResponse } from "next/server";
import { verifyJwt, COOKIE_NAME } from "@/lib/auth";

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8101";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "Belum login" }, { status: 401 });
  const user = await verifyJwt(token);
  if (!user) return NextResponse.json({ error: "Sesi tidak valid" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const oldPassword = String(body?.oldPassword ?? "");
  const newPassword = String(body?.newPassword ?? "");

  if (newPassword.length < 6) {
    return NextResponse.json({ error: "Password baru minimal 6 karakter" }, { status: 400 });
  }

  try {
    const res = await fetch(`${BACKEND}/api/auth/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
      cache: "no-store",
    });
    const data = (await res.json().catch(() => ({}))) as { detail?: string };
    if (!res.ok) {
      return NextResponse.json(
        { error: data.detail ?? "Gagal mengganti password" },
        { status: res.status }
      );
    }
  } catch {
    return NextResponse.json({ error: "Backend tidak terjangkau" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
