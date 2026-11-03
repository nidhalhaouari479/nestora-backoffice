import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, House } from "lucide-react";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { getLandlord } from "@/lib/catalog";
import { LandlordForm } from "../LandlordForm";

export const metadata: Metadata = { title: "Modifier le client" };

export default async function EditLandlordPage({ params }: PageProps<"/landlords/[id]">) {
  await requirePermission("landlords.manage", "landlords");
  const landlord = await getLandlord((await params).id);
  if (!landlord) notFound();

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Clients · {landlord.reference}</p>
          <h2>{landlord.full_name}</h2>
          <p>{landlord.user_id ? `Portail client actif · identifiant : ${landlord.email}` : "Pas encore d’accès au portail client : renseigne un e-mail et un mot de passe ci-dessous."}</p>
        </div>
        <div className="page-actions">
          <Link href={`/properties?landlord=${landlord.id}`} className="button-outline"><House size={16} aria-hidden="true" />Voir ses maisons</Link>
          <Link href={`/landlords/${landlord.id}/calendar`} className="button-dark"><CalendarDays size={16} aria-hidden="true" />Calendrier du client</Link>
        </div>
      </div>
      <LandlordForm landlord={landlord} />
    </div>
  );
}
