import { NextResponse } from "next/server";
import { getSessionState } from "@/lib/auth/session";

// Called by the idle watcher while the user is active, so typing on one page keeps the session alive.
export async function POST() {
  const state = await getSessionState();
  if (state.status === "active") return NextResponse.json({ ok: true });
  return NextResponse.json({ ok: false, status: state.status }, { status: 401 });
}
