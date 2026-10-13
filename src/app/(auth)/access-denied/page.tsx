import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionState } from "@/lib/auth/session";
import { findSection, homeFor } from "@/lib/auth/permissions";

export const metadata: Metadata = { title: "Accès non autorisé" };

export default async function AccessDeniedPage({ searchParams }: PageProps<"/access-denied">) {
  const state = await getSessionState();
  if (state.status === "anonymous") redirect("/login");
  if (state.status === "needs_2fa") redirect("/verify");
  if (state.status !== "active") redirect("/api/auth/expire");

  const { section: slug } = await searchParams;
  const section = typeof slug === "string" ? findSection(slug) : undefined;
  const { context } = state;

  return (
    <section className="auth-card centered">
      <span className="status-icon status-icon-coral">
        <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="16" fill="#e8463a" /><rect x="8" y="15" width="20" height="6" rx="2" fill="#fff" /></svg>
      </span>
      <p className="eyebrow eyebrow-coral">Autorisation requise</p>
      <h1>Accès non autorisé.</h1>
      <p className="auth-lead">
        Ton rôle <b>{context.roleLabel}</b> ne permet pas {section?.deniedAction ?? "d’ouvrir cette section"}.
      </p>
      <Link href={`/${homeFor(context.permissions)}`} className="button-primary">Retour à mon espace</Link>
      <p className="notice notice-yellow">La tentative d’accès a été enregistrée. Demande un accès temporaire uniquement si cette action fait partie de ta mission.</p>
    </section>
  );
}
