import type { Metadata } from "next";
import Link from "next/link";
import { Building2, CalendarDays, Clock3, CreditCard, House, Plus, Users } from "lucide-react";
import { requireStaff } from "@/lib/auth/session";
import { formatTime, getCommandCenter } from "@/lib/ops";
import { TaskList } from "@/components/portal/TaskList";

export const metadata: Metadata = { title: "Command Center" };

export default async function CommandCenterPage() {
  const staff = await requireStaff("command-center");
  const { stats, tasks, events } = await getCommandCenter();
  const canCreateProperty = staff.permissions.includes("properties.view");

  const kpis = [
    { tone: "teal", icon: House, label: "Biens publiés", value: stats.published_listings, hint: `+${stats.published_this_week} cette semaine` },
    { tone: "green", icon: Building2, label: "Places disponibles", value: stats.available_places, hint: `${stats.availability_fresh_pct}% à jour` },
    { tone: "blue", icon: Users, label: "Dossiers actifs", value: stats.active_cases, hint: `${stats.cases_need_action} nécessitent une action` },
    { tone: "sand", icon: CalendarDays, label: "Visites aujourd’hui", value: stats.visits_today, hint: `${stats.visits_to_confirm} à confirmer` },
    { tone: "yellow", icon: Clock3, label: "Options sous 3 h", value: stats.holds_under_3h, hint: `${stats.holds_at_risk} risque${stats.holds_at_risk > 1 ? "s" : ""} de pénalité` },
    { tone: "pink", icon: CreditCard, label: "Paiements à vérifier", value: stats.payments_to_verify, hint: stats.payments_to_verify ? `Plus ancien : ${stats.oldest_payment_minutes} min` : "Aucun en attente" },
  ];

  const health = [
    { label: "Disponibilités à jour", value: stats.availability_fresh_pct, tone: "teal" },
    { label: "Paiements réconciliés", value: stats.payments_reconciled_pct, tone: "teal" },
    { label: "Dossiers complets", value: stats.cases_complete_pct, tone: "amber" },
    { label: "SLA respectés", value: stats.sla_pct, tone: "coral" },
  ];

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Vue d’ensemble</p>
          <h2>Command Center</h2>
          <p>Les priorités opérationnelles de la journée, sans bruit inutile.</p>
        </div>
        <div className="page-actions">
          <Link href="/reservations" className="button-outline"><Plus size={16} aria-hidden="true" />Créer un dossier</Link>
          {canCreateProperty && <Link href="/properties" className="button-dark"><Plus size={16} aria-hidden="true" />Nouveau bien</Link>}
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
        <section className="panel" aria-labelledby="queue-title">
          <header className="panel-header">
            <div>
              <h3 id="queue-title">À traiter maintenant</h3>
              <p>File unifiée par urgence, SLA et impact client.</p>
            </div>
            <Link href="/actions">Ouvrir toute la file</Link>
          </header>
          <TaskList tasks={tasks} emptyLabel="Rien à traiter pour le moment." />
        </section>

        <div className="panel-stack">
          <section className="panel" aria-labelledby="today-title">
            <header className="panel-header">
              <div>
                <h3 id="today-title">Aujourd’hui</h3>
                <p>Planning croisé équipe &amp; terrain.</p>
              </div>
              <Link href="/planning">Planning complet</Link>
            </header>
            {events.length === 0 ? <p className="panel-empty">Aucun rendez-vous aujourd’hui.</p> : (
              <ol className="timeline">
                {events.map((event) => (
                  <li key={event.id}>
                    <time dateTime={event.starts_at}>{formatTime(event.starts_at)}</time>
                    <div className={`timeline-card tone-${event.tone}`}>
                      <strong>{event.title}</strong>
                      <small>{event.detail}</small>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="panel" aria-labelledby="health-title">
            <header className="panel-header">
              <div>
                <h3 id="health-title">Santé opérationnelle</h3>
                <p>Les contrôles qui protègent la qualité.</p>
              </div>
            </header>
            <ul className="health-list">
              {health.map((item) => (
                <li key={item.label}>
                  <div><span>{item.label}</span><strong>{item.value}%</strong></div>
                  <span className="progress" role="progressbar" aria-label={item.label} aria-valuenow={item.value} aria-valuemin={0} aria-valuemax={100}>
                    <i className={`progress-${item.tone}`} style={{ width: `${item.value}%` }} />
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
