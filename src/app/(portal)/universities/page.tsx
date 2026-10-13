import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { requireStaff } from "@/lib/auth/session";
import { listFaculties } from "@/lib/catalog";
import { Flash } from "@/components/admin/Flash";

export const metadata: Metadata = { title: "Facultés" };

export default async function FacultiesPage({ searchParams }: PageProps<"/universities">) {
  const staff = await requireStaff("universities");
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const faculties = await listFaculties({ q });
  const canManage = staff.permissions.includes("universities.manage");

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Offre</p>
          <h2>Facultés</h2>
          <p>Les facultés proposées aux étudiants et liées aux maisons.</p>
        </div>
        {canManage && <div className="page-actions"><Link href="/universities/new" className="button-dark"><Plus size={16} aria-hidden="true" />Nouvelle faculté</Link></div>}
      </div>

      <Flash saved={params.saved} />

      <section className="panel table-panel">
        <form className="table-filters" role="search">
          <label className="filter-search">
            <Search size={16} aria-hidden="true" />
            <span className="sr-only">Rechercher</span>
            <input name="q" defaultValue={q} placeholder="Nom, nom court ou ville" />
          </label>
          <button type="submit" className="button-outline">Filtrer</button>
        </form>

        {faculties.length === 0 ? (
          <p className="panel-empty">Aucune faculté trouvée.</p>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr><th>Faculté</th><th>Ville</th><th>Quartiers</th><th>Maisons</th><th>Statut</th><th><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody>
                {faculties.map((faculty) => (
                  <tr key={faculty.id}>
                    <td>
                      <span className="cell-with-thumb">
                        <span className="thumb" style={faculty.image_url ? { backgroundImage: `url('${faculty.image_url}')`, backgroundPosition: faculty.image_position } : undefined} aria-hidden="true" />
                        <span><strong>{faculty.short_name ?? faculty.name}</strong><small>{faculty.name}</small></span>
                      </span>
                    </td>
                    <td>{faculty.city}</td>
                    <td className="muted">{faculty.areas.join(" · ") || "—"}</td>
                    <td><Link href={`/properties?faculty=${faculty.id}`} className="table-link">{faculty.listing_universities[0]?.count ?? 0}</Link></td>
                    <td><span className={`pill ${faculty.is_active ? "pill-success" : "pill-neutral"}`}>{faculty.is_active ? "Visible" : "Masquée"}</span></td>
                    <td className="table-actions">{canManage && <Link href={`/universities/${faculty.id}`} className="table-link">Modifier</Link>}</td>
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
