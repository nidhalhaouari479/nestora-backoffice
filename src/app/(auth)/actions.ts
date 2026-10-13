"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient, REMEMBER_COOKIE } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { audit } from "@/lib/auth/audit";
import { getAuthUser, getStaffMember } from "@/lib/auth/session";
import { issueChallenge, verifyChallenge } from "@/lib/auth/two-factor";
import { homeFor } from "@/lib/auth/permissions";
import { requestInfo } from "@/lib/auth/request-info";

export type FormState = { error?: string; notice?: string; expiresAt?: string } | undefined;

const GENERIC_LOGIN_ERROR = "Adresse e-mail ou mot de passe incorrect.";

// AP1A_01 — email + password, then a 6-digit code is emailed (AP1A_02).
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

  await audit("login_password_ok", member.userId);
  try {
    await issueChallenge({ userId: member.userId, sessionId, email: member.email, name: member.fullName, force: true });
    await audit("two_factor_sent", member.userId);
  } catch (sendError) {
    console.error("[2FA] send failed", sendError);
    await supabase.auth.signOut({ scope: "local" });
    return { error: "Impossible d’envoyer le code de vérification. Contacte un administrateur." };
  }
  redirect("/verify");
}

// AP1A_02 — checks the code, then opens a staff session tied to this Auth session.
export async function verifyAction(_state: FormState, formData: FormData): Promise<FormState> {
  const code = String(formData.get("code") ?? "").replace(/\D/g, "");
  if (code.length !== 6) return { error: "Entre les six chiffres du code." };

  const auth = await getAuthUser();
  if (!auth) redirect("/login");
  const member = await getStaffMember(auth.userId);
  if (!member?.isActive) redirect("/api/auth/logout?reason=not_staff");

  const result = await verifyChallenge(auth.userId, auth.sessionId, code);
  if (!result.ok) {
    await audit(result.reason === "locked" ? "two_factor_locked" : "two_factor_failed", auth.userId, null, { reason: result.reason });
    if (result.reason === "locked") return { error: "Trop de tentatives. Demande un nouveau code." };
    if (result.reason === "expired") return { error: "Code expiré. Demande un nouveau code." };
    return { error: `Code incorrect. ${result.attemptsLeft} tentative${result.attemptsLeft === 1 ? "" : "s"} restante${result.attemptsLeft === 1 ? "" : "s"}.` };
  }

  const cookieStore = await cookies();
  const { ip, userAgent } = await requestInfo();
  const { error } = await getSupabaseAdmin().from("staff_sessions").upsert({
    auth_session_id: auth.sessionId,
    user_id: auth.userId,
    mfa_verified_at: new Date().toISOString(),
    last_seen_at: new Date().toISOString(),
    remember_device: cookieStore.get(REMEMBER_COOKIE)?.value === "1",
    ip_address: ip,
    user_agent: userAgent,
    revoked_at: null,
    revoked_reason: null,
  } as never);
  if (error) return { error: "Impossible d’ouvrir la session. Réessaie." };

  await audit("login_success", auth.userId, null, { role: member.role });
  redirect(`/${homeFor(member.permissions)}`);
}

export async function resendCodeAction(): Promise<FormState> {
  const auth = await getAuthUser();
  if (!auth) redirect("/login");
  const member = await getStaffMember(auth.userId);
  if (!member?.isActive) redirect("/api/auth/logout?reason=not_staff");

  try {
    const result = await issueChallenge({ userId: member.userId, sessionId: auth.sessionId, email: member.email, name: member.fullName });
    if (!result.ok) return { error: `Patiente ${result.retryInSeconds} s avant de demander un nouveau code.` };
    await audit("two_factor_sent", member.userId, null, { resend: true });
    return { notice: "Un nouveau code vient d’être envoyé.", expiresAt: result.expiresAt };
  } catch {
    return { error: "Impossible d’envoyer le code. Réessaie dans un instant." };
  }
}
