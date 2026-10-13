import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionState } from "@/lib/auth/session";
import { homeFor } from "@/lib/auth/permissions";
import { latestChallenge } from "@/lib/auth/two-factor";
import { VerifyForm } from "./VerifyForm";

export const metadata: Metadata = { title: "Vérification" };

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!domain) return email;
  return `${name.slice(0, 2)}${"•".repeat(Math.max(3, name.length - 3))}${name.slice(-1)}@${domain}`;
}

export default async function VerifyPage() {
  const state = await getSessionState();
  if (state.status === "anonymous") redirect("/login");
  if (state.status === "not_staff") redirect("/api/auth/logout?reason=not_staff");
  if (state.status === "expired") redirect("/api/auth/expire");
  if (state.status === "active") redirect(`/${homeFor(state.context.permissions)}`);

  const challenge = await latestChallenge(state.member.userId, state.sessionId);
  const expiresAt = challenge && !challenge.consumed_at ? challenge.expires_at : null;

  return (
    <section className="auth-card">
      <p className="eyebrow">Vérification renforcée</p>
      <h1>Confirme ton accès.</h1>
      <p className="auth-lead">
        Un code à six chiffres a été envoyé à <b>{maskEmail(state.member.email)}</b>. Cette étape protège les paiements, contrats et documents sensibles.
      </p>
      <VerifyForm expiresAt={expiresAt} />
    </section>
  );
}
