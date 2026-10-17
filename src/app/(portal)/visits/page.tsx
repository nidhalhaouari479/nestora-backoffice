import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { requireStaff } from "@/lib/auth/session";
import { VISIT_STATUSES, formatDate } from "@/lib/students";
import { VISIT_FILTERS, formatSlot, formatVisitDay, isPendingVisit, listVisits } from "@/lib/visits";
import { Flash } from "@/components/admin/Flash";
import { cancelVisitAction, confirmVisitAction } from "./actions";

export const metadata: Metadata = { title: "Visites" };

export default async function VisitsPage({ searchParams }: PageProps<"/visits">) {
  await requireStaff("visits");
  const params = await searchParams;
  const requested = typeof params.filter === "string" ? params.filter : "pending";
  const filter = VISIT_FILTERS.find((item) => item.value === requested)?.value ?? "pending";
  const error = typeof params.error === "string" ? params.error : "";
  const visits = await listVisits(filter);

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Étudiants</p>
          <h2>Visites</h2>
          <p>L’étudiant propose ses jours disponibles sur 7 jours. Choisis la date finale parmi ses propositions.</p>
        </div>
      </div>

      <nav className="tabs" aria-label="Filtrer les visites">
        {VISIT_FILTERS.map((item) => (
          <Link key={item.value} href={`/visits?filter=${item.value}`} className="tab" aria-current={item.value === filter ? "page" : undefined}>{item.label}</Link>
        ))}
      </nav>

      <Flash saved={params.saved} />
      {error && <p className="notice notice-error flash" role="alert"><AlertCircle size={16} aria-hidden="true" />{error}</p>}

      <section className="panel table-panel">
        {visits.length === 0 ? (
          <p className="panel-empty">{filter === "pending" ? "Aucune demande de visite à traiter." : "Aucune visite dans cette liste."}</p>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr><th>Référence</th><th>Étudiant</th><th>Maison</th><th>Date finale</th><th>Statut</th><th>Demandée le</th><th><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody>
                {visits.map((visit) => {
                  const pending = isPendingVisit(visit.status);
                  const status = VISIT_STATUSES[visit.status];
                  const formId = `confirm-${visit.id}`;
                  return (
                    <tr key={visit.id}>
                      <td className="mono">{visit.reference}</td>
                      <td>
                        {visit.student_profile_id
                          ? <Link href={`/students/${visit.student_profile_id}`} className="table-link">{visit.student_name ?? visit.student_email ?? "Étudiant"}</Link>
                          : <strong>{visit.student_name ?? "Étudiant"}</strong>}
                        <small>{visit.student_phone ?? visit.student_email ?? "—"}</small>
                      </td>
                      <td><Link href={`/properties/${visit.listing_id}`} className="table-link">{visit.listing_title}</Link><small>{visit.listing_neighborhood}</small></td>
                      <td>
                        {pending ? (
                          <form id={formId} action={confirmVisitAction} className="proposal-picker">
                            <input type="hidden" name="id" value={visit.id} />
                            <input type="hidden" name="filter" value={filter} />
                            <fieldset>
                              <legend className="sr-only">Date finale pour {visit.reference}</legend>
                              {visit.proposed_slots.map((proposal) => (
                                <label key={proposal.date} className="check-chip">
                                  <input type="radio" name="date" value={proposal.date} required />
                                  <span><strong>{formatVisitDay(proposal.date)}</strong> · {formatSlot(proposal.start, proposal.end)}</span>
                                </label>
                              ))}
                            </fieldset>
                          </form>
                        ) : visit.confirmed_date ? (
                          <><strong>{formatVisitDay(visit.confirmed_date)}</strong><small>{formatSlot(visit.slot_start, visit.slot_end)}</small></>
                        ) : (
                          <small>{visit.proposed_slots.map((proposal) => formatVisitDay(proposal.date)).join(" · ") || "—"}</small>
                        )}
                      </td>
                      <td><span className={`pill pill-${status?.tone ?? "neutral"}`}>{status?.label ?? visit.status}</span></td>
                      <td className="nowrap">{formatDate(visit.created_at, true)}</td>
                      <td className="table-actions">
                        <div className="action-stack">
                          {pending && <button type="submit" form={formId} className="button-dark button-small">Confirmer</button>}
                          {(pending || visit.status === "confirmed") && (
                            <form action={cancelVisitAction} className="inline-form">
                              <input type="hidden" name="id" value={visit.id} />
                              <input type="hidden" name="filter" value={filter} />
                              <button type="submit" className="danger-link">Annuler</button>
                            </form>
                          )}
                        </div>
                      </td>
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
