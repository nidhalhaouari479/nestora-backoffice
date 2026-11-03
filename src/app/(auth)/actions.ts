"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient, REMEMBER_COOKIE } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { audit } from "@/lib/auth/audit";
import { getStaffMember } from "@/lib/auth/session";
import { homeFor } from "@/lib/auth/permissions";
import { requestInfo } from "@/lib/auth/request-info";

export type FormState = { error?: string } | undefined;

const GENERIC_LOGIN_ERROR = "Adresse e-mail ou mot de passe incorrect.";

// AP1A_01 — email + password opens the staff session directly (no e-mailed code).
export async function loginAction(_state: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const remember = formData.get("remember") === "on";
  if (!email || !password) return { error: "Renseigne ton adresse e-mail et ton mot de passe." };

  const cookieStore = await cookies();
  cookieStore.set(REMEMBER_COOKIE, remember ? "1" : "0", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    await audit("login_failed", null, null, { email, reason: error?.code ?? "unknown" });
    return { error: error?.status === 429 ? "Trop de tentatives. Patiente quelques minutes." : GENERIC_LOGIN_ERROR };
  }

  const member = await getStaffMember(data.user.id);
  if (!member?.isActive) {
    await audit("login_blocked_not_staff", data.user.id, null, { email });
    await supabase.auth.signOut({ scope: "local" });
    return { error: "Ce compte n’a pas accès au portail Nestora Ops." };
  }

  const { data: claims } = await supabase.auth.getClaims(data.session.access_token);
  const sessionId = claims?.claims.session_id;
  if (typeof sessionId !== "string") return { error: "Session invalide. Réessaie." };

  // No second factor: the staff session opens right after the password check.
  // is_verified_staff() (RLS) only requires this staff_sessions row.
  const { ip, userAgent } = await requestInfo();
  const { error: sessionError } = await getSupabaseAdmin().from("staff_sessions").upsert({
    auth_session_id: sessionId,
    user_id: member.userId,
    mfa_verified_at: new Date().toISOString(),
    last_seen_at: new Date().toISOString(),
    remember_device: remember,
    ip_address: ip,
    user_agent: userAgent,
    revoked_at: null,
    revoked_reason: null,
  } as never);
  if (sessionError) {
    await supabase.auth.signOut({ scope: "local" });
    return { error: "Impossible d’ouvrir la session. Réessaie." };
  }

  await audit("login_success", member.userId, null, { role: member.role });
  redirect(`/${homeFor(member.permissions)}`);
}
