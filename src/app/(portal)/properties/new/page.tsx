import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/session";
import { listActiveLandlords, listFaculties } from "@/lib/catalog";
import { ListingForm } from "../ListingForm";

export const metadata: Metadata = { title: "Nouvelle maison" };

export default async function NewListingPage() {
  await requirePermission("properties.manage", "properties");
  const [landlords, faculties] = await Promise.all([listActiveLandlords(), listFaculties()]);

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Maisons</p>
          <h2>Nouvelle maison</h2>
          <p>Choisis le client propriétaire et au moins une faculté proche.</p>
        </div>
      </div>
      <ListingForm landlords={landlords} faculties={faculties} />
    </div>
  );
}
