import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLandlordAccount } from "@/lib/auth/landlord";
import { ClientLoginForm } from "./ClientLoginForm";

export const metadata: Metadata = { title: "Espace client" };

export default async function ClientLoginPage() {
  if (await getLandlordAccount()) redirect("/client");
  return (
    <div className="auth-card">
      <p className="eyebrow">Espace client</p>
      <h1>Connexion</h1>
      <p className="auth-lead">Connecte-toi avec l’e-mail et le mot de passe que Nestora t’a communiqués. Mot de passe oublié ? Contacte ton conseiller Nestora.</p>
      <ClientLoginForm />
    </div>
  );
}
