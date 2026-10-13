import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { publicEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { ROLE_LABELS, findSection, type StaffRole } from "./permissions";
import { audit } from "./audit";

export type StaffMember = {
  userId: string;
  email: string;
  fullName: string;
  role: StaffRole;
  roleLabel: string;
  isActive: boolean;
  permissions: string[];
};

export type StaffContext = StaffMember & { sessionId: string };

type StaffSessionRow = { auth_session_id: string; last_seen_at: string; revoked_at: string | null };

const LAST_SEEN_THROTTLE_MS = 60_000;

// Signed-in Supabase user (JWT verified) with the current Auth session id.
export const getAuthUser = cache(async () => {
  // Always per-request: auth pages must never be prerendered.
  await connection();
  if (!publicEnv.supabaseUrl || !publicEnv.supabaseAnonKey) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub || typeof claims.session_id !== "string") return null;
  return { userId: claims.sub, sessionId: claims.session_id, email: typeof claims.email === "string" ? claims.email : "" };
});

export const getStaffMember = cache(async (userId: string): Promise<StaffMember | null> => {
  const admin = getSupabaseAdmin();
  const { data: member } = await admin.from("staff_members").select("user_id, email, full_name, role, is_active").eq("user_id", userId).maybeSingle();
  if (!member) return null;
  const row = member as { user_id: string; email: string; full_name: string; role: StaffRole; is_active: boolean };
  const { data: permissions } = await admin.from("staff_role_permissions").select("permission").eq("role", row.role);
  return {
    userId: row.user_id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    roleLabel: ROLE_LABELS[row.role],
    isActive: row.is_active,
    permissions: ((permissions ?? []) as { permission: string }[]).map((item) => item.permission),
  };
});

export type SessionState = { status: "anonymous" } | { status: "not_staff" } | { status: "needs_2fa"; member: StaffMember; sessionId: string }
  | { status: "expired"; member: StaffMember } | { status: "active"; context: StaffContext };

// Resolves where the current request stands in the login → 2FA → portal flow.
export const getSessionState = cache(async (): Promise<SessionState> => {
  const auth = await getAuthUser();
  if (!auth) return { status: "anonymous" };

  const member = await getStaffMember(auth.userId);
  if (!member?.isActive) return { status: "not_staff" };

  const admin = getSupabaseAdmin();
  const { data } = await admin.from("staff_sessions").select("auth_session_id, last_seen_at, revoked_at").eq("auth_session_id", auth.sessionId).maybeSingle();
  const session = data as StaffSessionRow | null;
  if (!session) return { status: "needs_2fa", member, sessionId: auth.sessionId };
  if (session.revoked_at) return { status: "expired", member };

  const idleMs = Date.now() - new Date(session.last_seen_at).getTime();
  if (idleMs > publicEnv.idleMinutes * 60_000) {
    await admin.from("staff_sessions").update({ revoked_at: new Date().toISOString(), revoked_reason: "idle_timeout" } as never).eq("auth_session_id", auth.sessionId);
    await audit("session_expired", member.userId, null, { idle_minutes: Math.round(idleMs / 60_000) });
    return { status: "expired", member };
  }

  if (idleMs > LAST_SEEN_THROTTLE_MS) {
    await admin.from("staff_sessions").update({ last_seen_at: new Date().toISOString() } as never).eq("auth_session_id", auth.sessionId);
  }
  return { status: "active", context: { ...member, sessionId: auth.sessionId } };
});

// Guard for every portal page. Redirects to login, 2FA, session expired or access denied.
export async function requireStaff(sectionSlug?: string): Promise<StaffContext> {
  const state = await getSessionState();
  if (state.status === "anonymous") redirect("/login");
  if (state.status === "not_staff") redirect("/api/auth/logout?reason=not_staff");
  if (state.status === "needs_2fa") redirect("/verify");
  if (state.status === "expired") redirect("/api/auth/expire");

  const { context } = state;
  const section = sectionSlug ? findSection(sectionSlug) : undefined;
  if (section && !context.permissions.includes(section.permission)) {
    await audit("access_denied", context.userId, section.slug, { permission: section.permission, role: context.role });
    redirect(`/access-denied?section=${section.slug}`);
  }
  return context;
}

// For write actions: the role must hold a precise permission (e.g. "properties.manage").
export async function requirePermission(permission: string, resource: string): Promise<StaffContext> {
  const staff = await requireStaff();
  if (!staff.permissions.includes(permission)) {
    await audit("access_denied", staff.userId, resource, { permission, role: staff.role });
    redirect(`/access-denied?section=${resource}`);
  }
  return staff;
}
