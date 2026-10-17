import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Heart, MailCheck, Search, Users } from "lucide-react";
import { requireStaff } from "@/lib/auth/session";
import { listFaculties } from "@/lib/catalog";
import { STUDENT_GENDERS, countSignedUpThisWeek, formatDate, genderLabel, listStudents, studentName, studentPhone } from "@/lib/students";

export const metadata: Metadata = { title: "Étudiants" };

export default async function StudentsPage({ searchParams }: PageProps<"/students">) {
  await requireStaff("students");
  const params = await searchParams;
  const read = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : "");
  const filters = { q: read("q"), gender: read("gender"), university: read("university"), verified: read("verified") };
  const [students, faculties] = await Promise.all([listStudents(filters), listFaculties()]);
  const filtered = Object.values(filters).some(Boolean);

  const kpis = [
    { tone: "teal", icon: Users, label: filtered ? "Résultats" : "Inscrits", value: students.length, hint: `+${countSignedUpThisWeek(students)} cette semaine` },
    { tone: "green", icon: MailCheck, label: "Email vérifié", value: students.filter((s) => s.is_email_verified).length, hint: `${students.filter((s) => !s.is_email_verified).length} non vérifiés` },
    { tone: "blue", icon: CalendarDays, label: "Avec une visite", value: students.filter((s) => s.visits_count > 0).length, hint: `${students.reduce((sum, s) => sum + s.visits_count, 0)} demandes au total` },
    { tone: "pink", icon: Heart, label: "Avec des favoris", value: students.filter((s) => s.favorites_count > 0).length, hint: `${students.reduce((sum, s) => sum + s.favorites_count, 0)} favoris au total` },
  ];

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Étudiants</p>
          <h2>Étudiants</h2>
          <p>Tous les étudiants inscrits sur le site Nestora.</p>
        </div>
      </div>

      <ul className="kpi-grid kpi-4">
        {kpis.map(({ tone, icon: Icon, label, value, hint }) => (
          <li key={label} className={`kpi kpi-${tone}`}>
            <span className="kpi-icon"><Icon size={16} aria-hidden="true" /></span>
            <p>{label}</p>
            <strong>{value}</strong>
            <small>{hint}</small>
          </li>
        ))}
      </ul>

      <section className="panel table-panel">
        <form className="table-filters" role="search">
          <label className="filter-search">
            <Search size={16} aria-hidden="true" />
            <span className="sr-only">Rechercher</span>
            <input name="q" defaultValue={filters.q} placeholder="Nom, email ou téléphone" />
          </label>
          <select name="gender" defaultValue={filters.gender} aria-label="Genre">
            <option value="">Tous les genres</option>
            {STUDENT_GENDERS.map((gender) => <option key={gender.value} value={gender.value}>{gender.label}</option>)}
          </select>
          <select name="university" defaultValue={filters.university} aria-label="Faculté">
            <option value="">Toutes les facultés</option>
            {faculties.map((faculty) => <option key={faculty.id} value={faculty.id}>{faculty.short_name || faculty.name}</option>)}
          </select>
          <select name="verified" defaultValue={filters.verified} aria-label="Email">
            <option value="">Email : tous</option>
            <option value="yes">Email vérifié</option>
            <option value="no">Email non vérifié</option>
          </select>
          <button type="submit" className="button-outline">Filtrer</button>
        </form>

        {students.length === 0 ? (
          <p className="panel-empty">{filtered ? "Aucun étudiant ne correspond à ces filtres." : "Aucun étudiant inscrit pour le moment."}</p>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr><th>Étudiant</th><th>Téléphone</th><th>Genre</th><th>Faculté</th><th>Activité</th><th>Inscrit le</th><th>Dernière connexion</th><th>Email</th><th><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td><strong>{studentName(student)}</strong><small>{student.email ?? "—"}</small></td>
                    <td className="nowrap">{studentPhone(student)}</td>
                    <td>{genderLabel(student.gender)}</td>
                    <td>{student.university_name ?? "—"}</td>
                    <td className="nowrap"><small>{student.favorites_count} favori{student.favorites_count > 1 ? "s" : ""} · {student.visits_count} visite{student.visits_count > 1 ? "s" : ""}</small><small>{student.holds_count} option{student.holds_count > 1 ? "s" : ""} · {student.cases_count} dossier{student.cases_count > 1 ? "s" : ""}</small></td>
                    <td className="nowrap">{formatDate(student.created_at)}</td>
                    <td className="nowrap">{formatDate(student.last_sign_in_at, true)}</td>
                    <td><span className={`pill ${student.is_email_verified ? "pill-success" : "pill-warning"}`}>{student.is_email_verified ? "Vérifié" : "Non vérifié"}</span></td>
                    <td className="table-actions"><Link href={`/students/${student.id}`} className="table-link">Voir la fiche</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
