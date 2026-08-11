import { NextRequest, NextResponse } from "next/server";
import { verifyJwt, COOKIE_NAME, type Role } from "@/lib/auth";

const PROTECTED_ROLES: Record<string, Role[]> = {
  "/input": ["admin", "engineer"],
  "/impor": ["admin", "engineer"],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/login"
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  const user = token ? await verifyJwt(token) : null;

  if (!user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const allowed = PROTECTED_ROLES[pathname];
  if (allowed && !allowed.includes(user.role)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
