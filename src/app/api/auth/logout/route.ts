import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getAuthUser } from "@/lib/auth/session";
import { audit } from "@/lib/auth/audit";

async function logout(request: NextRequest) {
  const reason = request.nextUrl.searchParams.get("reason");
  const auth = await getAuthUser();
  if (auth) {
    await getSupabaseAdmin().from("staff_sessions")
      .update({ revoked_at: new Date().toISOString(), revoked_reason: reason ?? "logout" } as never)
      .eq("auth_session_id", auth.sessionId).is("revoked_at", null);
    await audit(reason === "not_staff" ? "login_blocked_not_staff" : "logout", auth.userId);
  }
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut({ scope: "local" });
  const target = new URL("/login", request.url);
  if (reason === "not_staff") target.searchParams.set("error", "not_staff");
  return NextResponse.redirect(target, { status: 303 });
}

export const GET = logout;
export const POST = logout;
