import type { Metadata } from "next";
import Link from "next/link";
import { BedDouble, CalendarCheck, CalendarClock, House, KeyRound, Users } from "lucide-react";
import { requireLandlord } from "@/lib/auth/landlord";
import { PENDING_VISIT, TENANT_ACTIVE, TENANT_IN_PROGRESS, listClientHouses, listClientTenants, listClientVisits } from "@/lib/client-portal";
import { todayInTunis } from "@/lib/calendar";
import { formatSlot, formatVisitDay } from "@/lib/visits";

export const metadata: Metadata = { title: "Tableau de bord" };

// Client dashboard: houses, places, visits and tenants at a glance.
export default async function ClientDashboardPage() {
  const account = await requireLandlord();
  const [houses, visits, tenants] = await Promise.all([listClientHouses(account.id), listClientVisits(account.id), listClientTenants(account.id)]);
  const today = todayInTunis();
  const month = today.slice(0, 7);

  const published = houses.filter((house) => house.status === "published").length;
  const capacity = houses.reduce((sum, house) => sum + house.capacity, 0);
  const free = houses.reduce((sum, house) => sum + house.available_places, 0);
  const pending = visits.filter((visit) => PENDING_VISIT.includes(visit.status));
  const upcoming = visits
    .filter((visit) => visit.status === "confirmed" && visit.confirmed_date && visit.confirmed_date >= today)
    .sort((a, b) => `${a.confirmed_date}${a.slot_start}`.localeCompare(`${b.confirmed_date}${b.slot_start}`));
  const visitsThisMonth = visits.filter((visit) => visit.created_at.slice(0, 7) === month).length;
  const activeTenants = tenants.filter((tenant) => TENANT_ACTIVE.includes(tenant.status)).length;
  const inProgress = tenants.filter((tenant) => TENANT_IN_PROGRESS.includes(tenant.status)).length;
  const occupancy = capacity > 0 ? Math.round(((capacity - free) / capacity) * 100) : 0;

  const kpis = [
    { tone: "sand", icon: House, label: "Maisons en ligne", value: `${published}/${houses.length}`, hint: `${houses.length - published} hors ligne` },
    { tone: "green", icon: BedDouble, label: "Places disponibles", value: free, hint: `${capacity} places au total` },
    { tone: "pink", icon: CalendarClock, label: "Visites à traiter", value: pending.length, hint: pending.length ? "Choisis un créneau" : "Aucune en attente" },
    { tone: "teal", icon: CalendarCheck, label: "Visites à venir", value: upcoming.length, hint: `${visitsThisMonth} demande${visitsThisMonth > 1 ? "s" : ""} ce mois-ci` },
    { tone: "blue", icon: KeyRound, label: "Locataires actifs", value: activeTenants, hint: `${inProgress} dossier${inProgress > 1 ? "s" : ""} en cours` },
    { tone: "yellow", icon: Users, label: "Taux d’occupation", value: `${occupancy} %`, hint: `${capacity - free} place${capacity - free > 1 ? "s" : ""} occupée${capacity - free > 1 ? "s" : ""}` },
  ];

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <h2>Bonjour, {account.fullName.split(" ")[0]}</h2>
          <p>Le point sur tes maisons, tes visites et tes locataires.</p>
        </div>
        <div className="page-actions">
          <Link href="/client/calendrier" className="button-outline">Mon calendrier</Link>
          <Link href="/client/visites" className="button-dark">Demandes de visite{pending.length ? ` (${pending.length})` : ""}</Link>
        </div>
      </div>

      <ul className="kpi-grid kpi-6">
        {kpis.map(({ tone, icon: Icon, label, value, hint }) => (
          <li key={label} className={`kpi kpi-${tone}`}>
            <span className="kpi-icon"><Icon size={16} aria-hidden="true" /></span>
            <p>{label}</p>
            <strong>{value}</strong>
            <small>{hint}</small>
          </li>
        ))}
      </ul>

      <div className="panel-grid">
        <section className="panel" aria-labelledby="upcoming-title">
          <header className="panel-header">
            <div>
              <h3 id="upcoming-title">Prochaines visites</h3>
              <p>Visites confirmées pour tes maisons.</p>
            </div>
            <Link href="/client/calendrier">Voir le calendrier</Link>
          </header>
          {upcoming.length === 0 ? <p className="panel-empty">Aucune visite confirmée à venir.</p> : (
            <ol className="agenda">
              {upcoming.slice(0, 8).map((visit) => (
                <li key={visit.id}>
                  <time dateTime={visit.confirmed_date!}>{formatSlot(visit.slot_start, visit.slot_end).split(" – ")[0]}</time>
                  <div><strong>{formatVisitDay(visit.confirmed_date!)} · {visit.listing_title}</strong><small>Visite avec {visit.student_first_name} · {formatSlot(visit.slot_start, visit.slot_end)}</small></div>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="panel" aria-labelledby="houses-title">
          <header className="panel-header">
            <div>
              <h3 id="houses-title">Occupation par maison</h3>
              <p>Places occupées sur la capacité totale.</p>
            </div>
            <Link href="/client/maisons">Mes maisons</Link>
          </header>
          {houses.length === 0 ? <p className="panel-empty">Aucune maison liée à ton compte.</p> : (
            <ul className="health-list">
              {houses.map((house) => {
                const used = house.capacity - house.available_places;
                const pct = house.capacity > 0 ? Math.round((used / house.capacity) * 100) : 0;
                return (
                  <li key={house.id}>
                    <div><span>{house.title}</span><strong>{used}/{house.capacity}</strong></div>
                    <span className="progress" role="progressbar" aria-label={house.title} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                      <i className={pct >= 100 ? "progress-teal" : "progress-amber"} style={{ width: `${pct}%` }} />
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
