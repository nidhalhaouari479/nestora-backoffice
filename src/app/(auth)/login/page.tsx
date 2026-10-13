import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionState } from "@/lib/auth/session";
import { homeFor } from "@/lib/auth/permissions";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const state = await getSessionState();
  if (state.status === "active") redirect(`/${homeFor(state.context.permissions)}`);
  if (state.status === "needs_2fa") redirect("/verify");

  const { error } = await searchParams;
  return (
    <section className="auth-card">
      <p className="eyebrow">Accès équipe</p>
      <h1>Bienvenue.</h1>
      <p className="auth-lead">Connecte-toi avec ton compte d’entreprise. L’accès est limité selon ton rôle.</p>
      <LoginForm initialError={error === "not_staff" ? "Ce compte n’a pas accès au portail Nestora Ops." : undefined} />
    </section>
  );
}
