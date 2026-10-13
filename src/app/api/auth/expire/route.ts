import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getAuthUser } from "@/lib/auth/session";

// Ends an idle or revoked session, then shows AP1A_03 (Session Expired).
export async function GET(request: NextRequest) {
  const auth = await getAuthUser();
  if (auth) {
    await getSupabaseAdmin().from("staff_sessions")
      .update({ revoked_at: new Date().toISOString(), revoked_reason: "idle_timeout" } as never)
      .eq("auth_session_id", auth.sessionId).is("revoked_at", null);
  }
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut({ scope: "local" });
  return NextResponse.redirect(new URL("/session-expired", request.url));
}
