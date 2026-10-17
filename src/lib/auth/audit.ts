import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requestInfo } from "./request-info";

export type AuditAction =
  | "login_failed" | "login_password_ok" | "login_blocked_not_staff" | "two_factor_sent" | "two_factor_failed"
  | "two_factor_locked" | "login_success" | "session_expired" | "logout" | "access_denied"
  | "landlord_created" | "landlord_updated" | "faculty_created" | "faculty_updated" | "listing_created" | "listing_updated"
  | "feature_created" | "feature_updated" | "feature_deleted" | "visit_confirmed" | "visit_cancelled";

// Audit failures must never block the user flow, so errors are only logged.
export async function audit(action: AuditAction, actorId: string | null, resource: string | null = null, metadata: Record<string, unknown> = {}) {
  try {
    const { ip, userAgent } = await requestInfo();
    const { error } = await getSupabaseAdmin().from("audit_log").insert({
      actor_id: actorId,
      action,
      resource,
      metadata,
      ip_address: ip,
      user_agent: userAgent,
    } as never);
    if (error) console.error(`[audit] ${action}: ${error.message}`);
  } catch (error) {
    console.error(`[audit] ${action}:`, error);
  }
}
