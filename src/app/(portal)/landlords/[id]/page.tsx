import type { Metadata } from "next";
import Link from "next/link";
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
          <p><Link href={`/properties?landlord=${landlord.id}`} className="table-link">Voir ses maisons</Link></p>
        </div>
      </div>
      <LandlordForm landlord={landlord} />
    </div>
  );
}
