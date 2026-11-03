import type { Metadata } from "next";
import { requireLandlord } from "@/lib/auth/landlord";
import { LISTING_STATUS, PENDING_VISIT, TENANT_ACTIVE, listClientHouses, listClientTenants, listClientVisits } from "@/lib/client-portal";
import { todayInTunis } from "@/lib/calendar";

export const metadata: Metadata = { title: "Mes maisons" };

export default async function ClientHousesPage() {
  const account = await requireLandlord();
  const [houses, visits, tenants] = await Promise.all([listClientHouses(account.id), listClientVisits(account.id), listClientTenants(account.id)]);
  const today = todayInTunis();
  const money = new Intl.NumberFormat("fr-FR");

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <h2>Mes maisons</h2>
          <p>Les maisons que Nestora loue pour toi. Pour modifier une annonce, contacte ton conseiller Nestora.</p>
        </div>
      </div>

      {houses.length === 0 ? (
        <section className="panel"><p className="panel-empty">Aucune maison n’est encore liée à ton compte.</p></section>
      ) : (
        <ul className="house-grid">
          {houses.map((house) => {
            const status = LISTING_STATUS[house.status] ?? { label: house.status, tone: "neutral" };
            const houseVisits = visits.filter((visit) => visit.listing_id === house.id);
            const pending = houseVisits.filter((visit) => PENDING_VISIT.includes(visit.status)).length;
            const upcoming = houseVisits.filter((visit) => visit.status === "confirmed" && (visit.confirmed_date ?? "") >= today).length;
            const activeTenants = tenants.filter((tenant) => tenant.listing_id === house.id && TENANT_ACTIVE.includes(tenant.status)).length;
            return (
              <li key={house.id} className="panel house-card">
                <span className="house-photo" style={house.cover ? { backgroundImage: `url('${house.cover}')` } : undefined} aria-hidden="true" />
                <div className="house-body">
                  <div className="house-head">
                    <div><strong>{house.title}</strong><small>{house.neighborhood}, {house.city}</small></div>
                    <span className={`pill pill-${status.tone}`}>{status.label}</span>
                  </div>
                  <p className="house-price">{money.format(house.price_tnd)} DT <small>/ mois</small></p>
                  <dl className="house-stats">
                    <div><dt>Places libres</dt><dd>{house.available_places}/{house.capacity}</dd></div>
                    <div><dt>Visites à traiter</dt><dd>{pending}</dd></div>
                    <div><dt>Visites à venir</dt><dd>{upcoming}</dd></div>
                    <div><dt>Locataires</dt><dd>{activeTenants}</dd></div>
                  </dl>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
