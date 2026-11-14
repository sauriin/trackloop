import { NextResponse } from "next/server";
import { readState, writeState } from "@/lib/db";
import type { AppState } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ state: readState() });
}

export async function PUT(request: Request) {
  let state: AppState | undefined;
  try {
    const body = (await request.json()) as { state?: AppState };
    state = body?.state;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!state || typeof state !== "object" || !Array.isArray(state.office) || !Array.isArray(state.reminders)) {
    return NextResponse.json({ error: "Invalid app state." }, { status: 400 });
  }

  try {
    writeState(state);
  } catch (err) {
    console.error("Could not write local database", err);
    return NextResponse.json({ error: "Could not save to the local database." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
