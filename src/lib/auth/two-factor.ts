import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { serverEnv } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { sendTwoFactorEmail } from "@/lib/mail";

type Challenge = {
  id: string;
  code_hash: string;
  attempts: number;
  expires_at: string;
  consumed_at: string | null;
  created_at: string;
};

function hashCode(userId: string, sessionId: string, code: string) {
  const { twoFactorSecret } = serverEnv();
  if (twoFactorSecret.length < 32) throw new Error("ADMIN_2FA_SECRET must be at least 32 characters.");
  return createHmac("sha256", twoFactorSecret).update(`${userId}:${sessionId}:${code}`).digest("hex");
}

export async function latestChallenge(userId: string, sessionId: string) {
  const { data } = await getSupabaseAdmin()
    .from("staff_mfa_challenges")
    .select("id, code_hash, attempts, expires_at, consumed_at, created_at")
    .eq("user_id", userId)
    .eq("auth_session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as Challenge | null;
}

export type IssueResult = { ok: true; expiresAt: string } | { ok: false; reason: "too_soon"; retryInSeconds: number };

// Creates a new 6-digit code for this Auth session (older ones are invalidated) and emails it.
export async function issueChallenge(params: { userId: string; sessionId: string; email: string; name: string; force?: boolean }): Promise<IssueResult> {
  const env = serverEnv();
  const admin = getSupabaseAdmin();
  const previous = await latestChallenge(params.userId, params.sessionId);

  if (previous && !params.force) {
    const elapsed = (Date.now() - new Date(previous.created_at).getTime()) / 1000;
    if (elapsed < env.resendSeconds) return { ok: false, reason: "too_soon", retryInSeconds: Math.ceil(env.resendSeconds - elapsed) };
  }

  await admin.from("staff_mfa_challenges").update({ consumed_at: new Date().toISOString() } as never)
    .eq("user_id", params.userId).eq("auth_session_id", params.sessionId).is("consumed_at", null);

  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  const expiresAt = new Date(Date.now() + env.codeTtlSeconds * 1000).toISOString();
  const { error } = await admin.from("staff_mfa_challenges").insert({
    user_id: params.userId,
    auth_session_id: params.sessionId,
    code_hash: hashCode(params.userId, params.sessionId, code),
    expires_at: expiresAt,
  } as never);
  if (error) throw new Error(`Could not store 2FA challenge: ${error.message}`);

  await sendTwoFactorEmail({ to: params.email, name: params.name, code, ttlMinutes: Math.round(env.codeTtlSeconds / 60) });
  return { ok: true, expiresAt };
}

export type VerifyResult = { ok: true } | { ok: false; reason: "invalid" | "expired" | "locked"; attemptsLeft?: number };

export async function verifyChallenge(userId: string, sessionId: string, code: string): Promise<VerifyResult> {
  const env = serverEnv();
  const admin = getSupabaseAdmin();
  const challenge = await latestChallenge(userId, sessionId);

  if (!challenge || challenge.consumed_at) return { ok: false, reason: "expired" };
  if (new Date(challenge.expires_at).getTime() < Date.now()) return { ok: false, reason: "expired" };
  if (challenge.attempts >= env.maxAttempts) return { ok: false, reason: "locked" };

  const expected = Buffer.from(challenge.code_hash, "hex");
  const received = Buffer.from(hashCode(userId, sessionId, code), "hex");
  const isValid = expected.length === received.length && timingSafeEqual(expected, received);

  if (!isValid) {
    const attempts = challenge.attempts + 1;
    await admin.from("staff_mfa_challenges").update({ attempts } as never).eq("id", challenge.id);
    return attempts >= env.maxAttempts ? { ok: false, reason: "locked" } : { ok: false, reason: "invalid", attemptsLeft: env.maxAttempts - attempts };
  }

  // Consume atomically so the same code cannot open two sessions.
  const { data } = await admin.from("staff_mfa_challenges").update({ consumed_at: new Date().toISOString() } as never)
    .eq("id", challenge.id).is("consumed_at", null).select("id");
  return data && data.length > 0 ? { ok: true } : { ok: false, reason: "expired" };
}
