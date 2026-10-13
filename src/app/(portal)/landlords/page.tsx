import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { requireStaff } from "@/lib/auth/session";
import { listLandlords } from "@/lib/catalog";
import { Flash } from "@/components/admin/Flash";

export const metadata: Metadata = { title: "Clients" };

export default async function LandlordsPage({ searchParams }: PageProps<"/landlords">) {
  const staff = await requireStaff("landlords");
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const status = typeof params.status === "string" ? params.status : "all";
  const landlords = await listLandlords({ q, status });
  const canManage = staff.permissions.includes("landlords.manage");

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Offre</p>
          <h2>Clients</h2>
          <p>Les propriétaires qui louent leurs maisons via Nestora.</p>
        </div>
        {canManage && <div className="page-actions"><Link href="/landlords/new" className="button-dark"><Plus size={16} aria-hidden="true" />Nouveau client</Link></div>}
      </div>

      <Flash saved={params.saved} />

      <section className="panel table-panel">
        <form className="table-filters" role="search">
          <label className="filter-search">
            <Search size={16} aria-hidden="true" />
            <span className="sr-only">Rechercher</span>
            <input name="q" defaultValue={q} placeholder="Nom, téléphone, email ou référence" />
          </label>
          <select name="status" defaultValue={status} aria-label="Statut">
            <option value="all">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
          </select>
          <button type="submit" className="button-outline">Filtrer</button>
        </form>

        {landlords.length === 0 ? (
          <p className="panel-empty">{q || status !== "all" ? "Aucun client ne correspond à ces filtres." : "Aucun client pour le moment. Ajoute le premier propriétaire."}</p>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr><th>Référence</th><th>Client</th><th>Téléphone</th><th>Email</th><th>Maisons</th><th>Statut</th><th><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody>
                {landlords.map((landlord) => (
                  <tr key={landlord.id}>
                    <td className="mono">{landlord.reference}</td>
                    <td><strong>{landlord.full_name}</strong>{landlord.company_name && <small>{landlord.company_name}</small>}</td>
                    <td>{landlord.phone}</td>
                    <td>{landlord.email ?? "—"}</td>
                    <td><Link href={`/properties?landlord=${landlord.id}`} className="table-link">{landlord.listings[0]?.count ?? 0}</Link></td>
                    <td><span className={`pill ${landlord.is_active ? "pill-success" : "pill-neutral"}`}>{landlord.is_active ? "Actif" : "Inactif"}</span></td>
                    <td className="table-actions">{canManage && <Link href={`/landlords/${landlord.id}`} className="table-link">Modifier</Link>}</td>
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
