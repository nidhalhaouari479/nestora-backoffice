import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { requireStaff } from "@/lib/auth/session";
import { listingStatus } from "@/lib/catalog";
import { CASE_STATUSES, HOLD_STATUSES, VISIT_STATUSES, formatDate, genderLabel, getStudent, studentName, studentPhone } from "@/lib/students";

export const metadata: Metadata = { title: "Fiche étudiant" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function Pill({ status }: { status?: { label: string; tone: string } }) {
  return <span className={`pill pill-${status?.tone ?? "neutral"}`}>{status?.label ?? "—"}</span>;
}

function Section({ title, hint, count, empty, children }: { title: string; hint: string; count: number; empty: string; children: ReactNode }) {
  return (
    <section className="panel table-panel">
      <header className="panel-header table-panel-header">
        <div>
          <h3>{title} <span className="muted">({count})</span></h3>
          <p>{hint}</p>
        </div>
      </header>
      {count === 0 ? <p className="panel-empty">{empty}</p> : <div className="table-scroll">{children}</div>}
    </section>
  );
}

export default async function StudentPage({ params }: PageProps<"/students/[id]">) {
  await requireStaff("students");
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const student = await getStudent(id);
  if (!student) notFound();
  const { profile, favorites, visits, holds, cases } = student;

  const info: [string, ReactNode][] = [
    ["Prénom", profile.first_name || "—"],
    ["Nom", profile.last_name || "—"],
    ["Email", profile.email ?? "—"],
    ["Email vérifié", <Pill key="email" status={profile.is_email_verified || profile.email_confirmed_at ? { label: `Oui${profile.email_confirmed_at ? ` · ${formatDate(profile.email_confirmed_at)}` : ""}`, tone: "success" } : { label: "Non", tone: "warning" }} />],
    ["Téléphone", studentPhone(profile)],
    ["Téléphone vérifié", <Pill key="phone" status={profile.is_phone_verified ? { label: "Oui", tone: "success" } : { label: "Non", tone: "neutral" }} />],
    ["Genre", genderLabel(profile.gender)],
    ["Faculté", profile.university_name ?? "—"],
    ["Canal préféré", profile.preferred_channel === "whatsapp" ? "WhatsApp" : profile.preferred_channel === "sms" ? "SMS" : profile.preferred_channel],
    ["Inscrit le", formatDate(profile.created_at, true)],
    ["Dernière connexion", formatDate(profile.last_sign_in_at, true)],
    ["Profil modifié le", formatDate(profile.updated_at, true)],
    ["Identifiant compte", <span key="uid" className="mono">{profile.user_id ?? "—"}</span>],
  ];

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow"><Link href="/students" className="table-link"><ArrowLeft size={13} aria-hidden="true" />Étudiants</Link></p>
          <h2>{studentName(profile)}</h2>
          <p>{profile.email ?? studentPhone(profile)}</p>
        </div>
      </div>

      <section className="panel table-panel">
        <header className="panel-header table-panel-header">
          <div>
            <h3>Profil</h3>
            <p>Informations saisies à l’inscription sur le site.</p>
          </div>
        </header>
        <dl className="info-list">
          {info.map(([label, value]) => (
            <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
          ))}
        </dl>
      </section>

      <Section title="Favoris" hint="Maisons enregistrées par l’étudiant." count={favorites.length} empty="Aucun favori.">
        <table className="data-table">
          <thead><tr><th>Maison</th><th>Prix</th><th>Statut</th><th>Ajouté le</th></tr></thead>
          <tbody>
            {favorites.map((item) => (
              <tr key={item.listing_id}>
                <td><Link href={`/properties/${item.listing_id}`} className="table-link">{item.title}</Link><small>{item.neighborhood}</small></td>
                <td className="nowrap">{item.price_tnd} TND</td>
                <td><Pill status={listingStatus(item.status)} /></td>
                <td className="nowrap">{formatDate(item.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Visites" hint="Demandes de visite envoyées depuis le site." count={visits.length} empty="Aucune demande de visite.">
        <table className="data-table">
          <thead><tr><th>Référence</th><th>Maison</th><th>Dates proposées</th><th>Créneau</th><th>Statut</th><th>Demandée le</th></tr></thead>
          <tbody>
            {visits.map((visit) => (
              <tr key={visit.id}>
                <td className="mono">{visit.reference}</td>
                <td><Link href={`/properties/${visit.listing_id}`} className="table-link">{visit.title}</Link></td>
                <td>{visit.confirmed_date ? <strong>{formatDate(visit.confirmed_date)}</strong> : visit.preferred_dates.map((date) => formatDate(date)).join(" · ")}</td>
                <td className="nowrap">{visit.confirmed_date ? `${visit.slot_start.slice(0, 5)} – ${visit.slot_end.slice(0, 5)}` : <Link href="/visits" className="table-link">À choisir</Link>}</td>
                <td><Pill status={VISIT_STATUSES[visit.status]} /></td>
                <td className="nowrap">{formatDate(visit.created_at, true)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Options 24 h" hint="Maisons bloquées temporairement par l’étudiant." count={holds.length} empty="Aucune option.">
        <table className="data-table">
          <thead><tr><th>Maison</th><th>Statut</th><th>Expire le</th><th>Créée le</th></tr></thead>
          <tbody>
            {holds.map((hold) => (
              <tr key={hold.id}>
                <td><Link href={`/properties/${hold.listing_id}`} className="table-link">{hold.title}</Link></td>
                <td><Pill status={HOLD_STATUSES[hold.status]} /></td>
                <td className="nowrap">{formatDate(hold.expires_at, true)}</td>
                <td className="nowrap">{formatDate(hold.created_at, true)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Dossiers de location" hint="Réservations, contrats et emménagements." count={cases.length} empty="Aucun dossier.">
        <table className="data-table">
          <thead><tr><th>Référence</th><th>Maison</th><th>Statut</th><th>Complet</th><th>Ouvert le</th></tr></thead>
          <tbody>
            {cases.map((item) => (
              <tr key={item.id}>
                <td className="mono">{item.reference}</td>
                <td>{item.listing_id ? <Link href={`/properties/${item.listing_id}`} className="table-link">{item.title}</Link> : "—"}</td>
                <td><Pill status={CASE_STATUSES[item.status]} />{item.needs_action && <small>Action requise</small>}</td>
                <td>{item.is_complete ? "Oui" : "Non"}</td>
                <td className="nowrap">{formatDate(item.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </div>
  );
}
