import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requireStaff } from "@/lib/auth/session";
import { formatTime, getWorkspace } from "@/lib/ops";
import { TaskList } from "@/components/portal/TaskList";

export const metadata: Metadata = { title: "Mon espace" };

export default async function WorkspacePage() {
  const staff = await requireStaff("workspace");
  const { stats, tasks, events } = await getWorkspace(staff.userId);

  const kpis = [
    { tone: "blue", label: "Mes tâches ouvertes", value: stats.open_tasks, hint: `${stats.due_before_13} à traiter avant 13:00` },
    { tone: "pink", label: "Mes approbations", value: stats.approvals, hint: `${stats.sensitive_payments} paiement${stats.sensitive_payments > 1 ? "s" : ""} sensible${stats.sensitive_payments > 1 ? "s" : ""}` },
    { tone: "yellow", label: "Mon planning", value: stats.planning_today, hint: stats.next_event_at ? `prochain rendez-vous ${formatTime(stats.next_event_at)}` : "aucun rendez-vous à venir" },
    { tone: "green", label: "Échéances à risque", value: stats.at_risk, hint: stats.at_risk ? `plus ancienne : ${stats.oldest_at_risk_minutes} min` : "aucune échéance proche" },
  ];

  const indicators = [
    { label: "Actions dans le délai", value: `${stats.in_time_pct}%`, tone: "teal" },
    { label: "Temps médian de traitement", value: `${stats.median_minutes} min`, tone: "ink" },
    { label: "Actions rouvertes", value: String(stats.reopened), tone: stats.reopened > 0 ? "coral" : "ink" },
  ];

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Espace personnel</p>
          <h2>Mon espace de travail</h2>
          <p>Tout ce qui t’est assigné aujourd’hui, sans bruit inutile.</p>
        </div>
        <div className="page-actions">
          <Link href="/actions" className="button-dark wide"><Plus size={16} aria-hidden="true" />Créer une tâche</Link>
        </div>
      </div>

      <ul className="kpi-grid kpi-4">
        {kpis.map((kpi) => (
          <li key={kpi.label} className={`kpi kpi-${kpi.tone}`}>
            <p>{kpi.label}</p>
            <strong>{kpi.value}</strong>
            <small>{kpi.hint}</small>
          </li>
        ))}
      </ul>

      <div className="panel-grid workspace-grid">
        <section className="panel" aria-labelledby="priority-title">
          <header className="panel-header">
            <div>
              <h3 id="priority-title">Ma priorité maintenant</h3>
              <p>Triée par impact étudiant, argent et délai.</p>
            </div>
            <Link href="/actions">Ouvrir ma file →</Link>
          </header>
          <TaskList tasks={tasks} withAction emptyLabel="Aucune tâche ne t’est assignée pour le moment." />
        </section>

        <div className="panel-stack">
          <section className="panel" aria-labelledby="my-planning-title">
            <header className="panel-header"><h3 id="my-planning-title">Mon planning</h3></header>
            {events.length === 0 ? <p className="panel-empty">Aucun rendez-vous aujourd’hui.</p> : (
              <ol className="agenda">
                {events.map((event) => (
                  <li key={event.id}>
                    <time dateTime={event.starts_at}>{formatTime(event.starts_at)}</time>
                    <div><strong>{event.title}</strong><small>{event.detail}</small></div>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="panel" aria-labelledby="indicators-title">
            <header className="panel-header"><h3 id="indicators-title">Mes indicateurs</h3></header>
            <dl className="indicators">
              {indicators.map((item) => (
                <div key={item.label}><dt>{item.label}</dt><dd className={`value-${item.tone}`}>{item.value}</dd></div>
              ))}
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
