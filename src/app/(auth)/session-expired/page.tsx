import type { Metadata } from "next";
import Link from "next/link";
import { Clock3 } from "lucide-react";
import { publicEnv } from "@/lib/env";

export const metadata: Metadata = { title: "Session expirée" };

export default function SessionExpiredPage() {
  return (
    <section className="auth-card centered">
      <span className="status-icon status-icon-teal"><Clock3 size={28} aria-hidden="true" /></span>
      <p className="eyebrow">Session fermée</p>
      <h1>Ta session a expiré.</h1>
      <p className="auth-lead">
        Après {publicEnv.idleMinutes} minutes d’inactivité, Nestora ferme automatiquement les sessions administratives pour protéger les dossiers et les paiements.
      </p>
      <Link href="/login" className="button-primary">Se reconnecter</Link>
      <p className="notice notice-teal">Ton travail enregistré est conservé. Les formulaires non envoyés doivent être vérifiés après reconnexion.</p>
    </section>
  );
}
