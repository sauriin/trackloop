import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  SESSION_MAX_AGE,
  createSession,
  safeEqual,
} from "@/lib/admin-auth";

/** Checks the admin password and, on success, starts a signed session. */
export async function POST(request: Request) {
  const password = process.env.ADMIN_PASSWORD ?? "";

  // Fail closed: without a configured password the console stays shut, even
  // if someone deploys this repo and forgets to set one.
  if (!password) {
    return NextResponse.json(
      {
        error:
          "Admin console is disabled. Set ADMIN_PASSWORD in your deployment environment to enable it.",
      },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }

  let given = "";
  try {
    const body = (await request.json()) as { password?: unknown };
    given = typeof body?.password === "string" ? body.password : "";
  } catch {
    given = "";
  }

  if (!safeEqual(given, password)) {
    return NextResponse.json(
      { error: "Incorrect password." },
      { status: 401, headers: { "cache-control": "no-store" } },
    );
  }

  const response = NextResponse.json(
    { ok: true },
    { headers: { "cache-control": "no-store" } },
  );
  response.cookies.set({
    name: ADMIN_COOKIE,
    value: await createSession(),
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE,
  });
  return response;
}

/** Sign out: clear the session cookie. */
export async function DELETE() {
  const response = NextResponse.json(
    { ok: true },
    { headers: { "cache-control": "no-store" } },
  );
  response.cookies.set({
    name: ADMIN_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
  return response;
}
