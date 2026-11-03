import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { requireStaff } from "@/lib/auth/session";
import { VISIT_STATUSES, formatDate } from "@/lib/students";
import { VISIT_FILTERS, formatSlot, formatVisitDay, isPendingVisit, listVisits } from "@/lib/visits";
import { Flash } from "@/components/admin/Flash";
import { VisitChooser } from "@/components/visits/VisitChooser";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { slotFreeness, visitWindow } from "@/lib/client-portal";
import { cancelVisitAction, chooseVisitSlotAction } from "./actions";

export const metadata: Metadata = { title: "Visites" };

export default async function VisitsPage({ searchParams }: PageProps<"/visits">) {
  await requireStaff("visits");
  const params = await searchParams;
  const requested = typeof params.filter === "string" ? params.filter : "pending";
  const filter = VISIT_FILTERS.find((item) => item.value === requested)?.value ?? "pending";
  const error = typeof params.error === "string" ? params.error : "";
  const visits = await listVisits(filter);
  const range = visitWindow();

  // Is each proposal still free in the Nestora calendar AND the client's calendar?
  const pendingVisits = visits.filter((visit) => isPendingVisit(visit.status));
  const { data: owners } = pendingVisits.length
    ? await getSupabaseAdmin().from("listings").select("id, landlord_id").in("id", [...new Set(pendingVisits.map((visit) => visit.listing_id))])
    : { data: [] };
  const landlordOf = new Map(((owners ?? []) as { id: string; landlord_id: string | null }[]).map((row) => [row.id, row.landlord_id]));
  const freeness = new Map<string, Map<string, boolean>>();
  await Promise.all(pendingVisits.map(async (visit) => {
    freeness.set(visit.id, await slotFreeness(landlordOf.get(visit.listing_id) ?? null, visit.proposed_slots.map((slot) => ({ date: slot.date, hour: Number(slot.start.slice(0, 2)) }))));
  }));

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Étudiants</p>
          <h2>Visites</h2>
          <p>L’étudiant propose jusqu’à 3 créneaux. Accepte l’un d’eux ou choisis un autre créneau libre : la visite passe en vert dans les calendriers de Nestora et du client.</p>
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
                          <VisitChooser
                            visitId={visit.id}
                            compact
                            minDate={range.today}
                            maxDate={range.max}
                            action={chooseVisitSlotAction}
                            proposals={visit.proposed_slots.map((slot) => ({ ...slot, free: freeness.get(visit.id)?.get(`${slot.date}|${Number(slot.start.slice(0, 2))}`) ?? false }))}
                          />
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
