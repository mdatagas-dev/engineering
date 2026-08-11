import { NextRequest, NextResponse } from "next/server";
import { getUser, verifyPassword, setUserPassword, verifyJwt, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "Belum login" }, { status: 401 });
  const user = await verifyJwt(token);
  if (!user) return NextResponse.json({ error: "Sesi tidak valid" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const oldPassword = String(body?.oldPassword ?? "");
  const newPassword = String(body?.newPassword ?? "");

  const record = await getUser(user.username);
  if (!record || !(await verifyPassword(oldPassword, record.salt, record.hash))) {
    return NextResponse.json({ error: "Password lama salah" }, { status: 400 });
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: "Password baru minimal 6 karakter" }, { status: 400 });
  }

  await setUserPassword(user.username, newPassword);
  return NextResponse.json({ ok: true });
}