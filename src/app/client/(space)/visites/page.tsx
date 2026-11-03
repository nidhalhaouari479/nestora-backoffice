import type { Metadata } from "next";
import { requireLandlord } from "@/lib/auth/landlord";
import { PENDING_VISIT, listClientVisits, slotFreeness, visitWindow } from "@/lib/client-portal";
import { formatDate } from "@/lib/students";
import { formatSlot, formatVisitDay } from "@/lib/visits";
import { VisitChooser } from "@/components/visits/VisitChooser";
import { clientConfirmVisitAction } from "../../actions";

export const metadata: Metadata = { title: "Demandes de visite" };

const STATUS: Record<string, { label: string; tone: string }> = {
  confirmed: { label: "Confirmée", tone: "success" },
  completed: { label: "Effectuée", tone: "neutral" },
  cancelled: { label: "Annulée", tone: "danger" },
};

// The client receives the students' visit requests and picks the slot (one of the proposals or another).
export default async function ClientVisitsPage() {
  const account = await requireLandlord();
  const visits = await listClientVisits(account.id);
  const range = visitWindow();
  const pending = visits.filter((visit) => PENDING_VISIT.includes(visit.status));
  const others = visits.filter((visit) => !PENDING_VISIT.includes(visit.status)).slice(0, 30);

  const freeness = await slotFreeness(account.id, pending.flatMap((visit) => visit.proposed_slots.map((slot) => ({ date: slot.date, hour: Number(slot.start.slice(0, 2)) }))));

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <h2>Demandes de visite</h2>
          <p>Chaque étudiant propose jusqu’à 3 créneaux. Accepte l’un d’eux ou choisis un autre créneau libre : la visite apparaît alors en vert dans ton calendrier.</p>
        </div>
      </div>

      <section className="visit-requests" aria-labelledby="pending-title">
        <h3 id="pending-title" className="section-title">À traiter <span className="pill pill-warning">{pending.length}</span></h3>
        {pending.length === 0 ? (
          <div className="panel"><p className="panel-empty">Aucune demande de visite en attente.</p></div>
        ) : (
          <ul className="visit-request-list">
            {pending.map((visit) => (
              <li key={visit.id} className="panel visit-request">
                <header>
                  <div>
                    <strong>{visit.listing_title}</strong>
                    <small>{visit.student_first_name} · demandée le {formatDate(visit.created_at, true)} · {visit.reference}</small>
                  </div>
                  <span className="pill pill-warning">À traiter</span>
                </header>
                <VisitChooser
                  visitId={visit.id}
                  minDate={range.today}
                  maxDate={range.max}
                  action={clientConfirmVisitAction}
                  proposals={visit.proposed_slots.map((slot) => ({ ...slot, free: freeness.get(`${slot.date}|${Number(slot.start.slice(0, 2))}`) ?? false }))}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {others.length > 0 && (
        <section className="panel table-panel" aria-labelledby="history-title">
          <h3 id="history-title" className="table-panel-header">Historique</h3>
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>Maison</th><th>Étudiant</th><th>Créneau</th><th>Statut</th></tr></thead>
              <tbody>
                {others.map((visit) => {
                  const status = STATUS[visit.status] ?? { label: visit.status, tone: "neutral" };
                  return (
                    <tr key={visit.id}>
                      <td><strong>{visit.listing_title}</strong><small className="mono">{visit.reference}</small></td>
                      <td>{visit.student_first_name}</td>
                      <td className="nowrap">{visit.confirmed_date ? <><strong>{formatVisitDay(visit.confirmed_date)}</strong><small>{formatSlot(visit.slot_start, visit.slot_end)}</small></> : "—"}</td>
                      <td><span className={`pill pill-${status.tone}`}>{status.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
