import { NextResponse, type NextRequest } from "next/server";

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};

/** Constant-time string compare so the password cannot be guessed by timing. */
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export default function proxy(request: NextRequest) {
  const password = process.env.ADMIN_PASSWORD ?? "";
  const user = process.env.ADMIN_USER?.trim() || "admin";

  // Fail closed: without a configured password the console stays shut, even
  // if someone deploys this repo and forgets to set one.
  if (!password) {
    return new NextResponse(
      "Admin console is disabled. Set ADMIN_PASSWORD (and optionally ADMIN_USER) to enable it.\n",
      { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } },
    );
  }

  const header = request.headers.get("authorization") ?? "";
  if (header.startsWith("Basic ")) {
    let decoded = "";
    try {
      decoded = atob(header.slice("Basic ".length).trim());
    } catch {
      decoded = "";
    }
    const separator = decoded.indexOf(":");
    const givenUser = separator === -1 ? "" : decoded.slice(0, separator);
    const givenPassword = separator === -1 ? "" : decoded.slice(separator + 1);

    if (safeEqual(givenUser, user) && safeEqual(givenPassword, password)) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Authentication required.\n", {
    status: 401,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "www-authenticate": 'Basic realm="Admin", charset="UTF-8"',
      "cache-control": "no-store",
    },
  });
}
