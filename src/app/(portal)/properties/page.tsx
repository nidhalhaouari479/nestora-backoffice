import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { requireStaff } from "@/lib/auth/session";
import { LISTING_STATUSES, listActiveLandlords, listFaculties, listListings, listingStatus, listingTypeLabel } from "@/lib/catalog";
import { Flash } from "@/components/admin/Flash";

export const metadata: Metadata = { title: "Maisons" };

function param(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

export default async function PropertiesPage({ searchParams }: PageProps<"/properties">) {
  const staff = await requireStaff("properties");
  const params = await searchParams;
  const filters = { q: param(params.q), status: param(params.status) || "all", landlord: param(params.landlord), faculty: param(params.faculty) };
  const canSeeLandlords = staff.permissions.includes("landlords.view");
  const [listings, landlords, faculties] = await Promise.all([
    listListings(filters),
    canSeeLandlords ? listActiveLandlords() : Promise.resolve([]),
    listFaculties(),
  ]);
  const canManage = staff.permissions.includes("properties.manage");

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Offre</p>
          <h2>Maisons</h2>
          <p>Chaque maison appartient à un client et est liée à une ou plusieurs facultés.</p>
        </div>
        {canManage && <div className="page-actions"><Link href="/properties/new" className="button-dark"><Plus size={16} aria-hidden="true" />Nouvelle maison</Link></div>}
      </div>

      <Flash saved={params.saved} />

      <section className="panel table-panel">
        <form className="table-filters" role="search">
          <label className="filter-search">
            <Search size={16} aria-hidden="true" />
            <span className="sr-only">Rechercher</span>
            <input name="q" defaultValue={filters.q} placeholder="Titre ou quartier" />
          </label>
          <select name="status" defaultValue={filters.status} aria-label="Statut">
            <option value="all">Tous les statuts</option>
            {LISTING_STATUSES.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
          </select>
          {canSeeLandlords && (
            <select name="landlord" defaultValue={filters.landlord} aria-label="Client">
              <option value="">Tous les clients</option>
              {landlords.map((landlord) => <option key={landlord.id} value={landlord.id}>{landlord.full_name}</option>)}
            </select>
          )}
          <select name="faculty" defaultValue={filters.faculty} aria-label="Faculté">
            <option value="">Toutes les facultés</option>
            {faculties.map((faculty) => <option key={faculty.id} value={faculty.id}>{faculty.short_name ?? faculty.name}</option>)}
          </select>
          <button type="submit" className="button-outline">Filtrer</button>
        </form>

        {listings.length === 0 ? (
          <p className="panel-empty">Aucune maison ne correspond à ces filtres.</p>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr><th>Maison</th><th>Client</th><th>Facultés</th><th>Prix</th><th>Places</th><th>Statut</th><th><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody>
                {listings.map((listing) => {
                  const cover = [...listing.listing_photos].sort((a, b) => a.sort_order - b.sort_order)[0];
                  const status = listingStatus(listing.status);
                  return (
                    <tr key={listing.id}>
                      <td>
                        <span className="cell-with-thumb">
                          <span className="thumb" style={cover ? { backgroundImage: `url('${cover.url}')` } : undefined} aria-hidden="true" />
                          <span><strong>{listing.title}</strong><small>{listingTypeLabel(listing.listing_type)} · {listing.neighborhood}</small></span>
                        </span>
                      </td>
                      <td>{listing.landlords?.full_name ?? <span className="pill pill-danger">Sans client</span>}</td>
                      <td>
                        <span className="tag-list">
                          {listing.listing_universities.map((link) => <span key={link.university_id} className="tag">{link.universities?.short_name ?? link.universities?.name ?? link.university_id}</span>)}
                        </span>
                      </td>
                      <td className="nowrap">{listing.price_tnd} TND</td>
                      <td>{listing.available_places}</td>
                      <td><span className={`pill pill-${status.tone}`}>{status.label}</span></td>
                      <td className="table-actions">{canManage && <Link href={`/properties/${listing.id}`} className="table-link">Modifier</Link>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
