import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, verifySession } from "@/lib/admin-auth";

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};

export default async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const configured = Boolean(process.env.ADMIN_PASSWORD);
  const authed = await verifySession(request.cookies.get(ADMIN_COOKIE)?.value);

  // The password prompt itself has to stay reachable while signed out.
  if (pathname === "/admin/login") {
    if (authed) return NextResponse.redirect(new URL("/admin", request.url));
    return NextResponse.next();
  }

  if (authed) return NextResponse.next();

  const login = new URL("/admin/login", request.url);
  if (configured) login.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(login);
}
