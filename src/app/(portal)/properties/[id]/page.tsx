import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { getListing, listActiveLandlords, listFaculties, listFeatures, listingStatus } from "@/lib/catalog";
import { ListingForm } from "../ListingForm";

export const metadata: Metadata = { title: "Modifier la maison" };

export default async function EditListingPage({ params }: PageProps<"/properties/[id]">) {
  await requirePermission("properties.manage", "properties");
  const [listing, landlords, faculties, features] = await Promise.all([getListing((await params).id), listActiveLandlords(), listFaculties(), listFeatures()]);
  if (!listing) notFound();
  const status = listingStatus(listing.status);
  const storefront = process.env.STOREFRONT_URL;

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Maisons · <span className={`pill pill-${status.tone}`}>{status.label}</span></p>
          <h2>{listing.title}</h2>
          {storefront && listing.status === "published" && (
            <p><a href={`${storefront}/logements/${listing.slug}`} target="_blank" rel="noreferrer" className="table-link">Voir dans l’application étudiante ↗</a></p>
          )}
        </div>
      </div>
      <ListingForm listing={listing} landlords={landlords} faculties={faculties} features={features} />
    </div>
  );
}
