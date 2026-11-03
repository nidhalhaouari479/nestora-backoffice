import type { Metadata } from "next";
import { requireLandlord } from "@/lib/auth/landlord";
import { TENANT_STATUS, listClientTenants } from "@/lib/client-portal";
import { formatDate } from "@/lib/students";

export const metadata: Metadata = { title: "Mes locataires" };

// Students renting (or about to rent) the client's houses.
export default async function ClientTenantsPage() {
  const account = await requireLandlord();
  const tenants = await listClientTenants(account.id);

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <h2>Mes locataires</h2>
          <p>Les étudiants qui louent tes maisons, et les dossiers de location en cours.</p>
        </div>
      </div>

      <section className="panel table-panel">
        {tenants.length === 0 ? (
          <p className="panel-empty">Aucun étudiant ne loue encore tes maisons.</p>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>Étudiant</th><th>Maison</th><th>Statut</th><th>Dossier ouvert le</th><th>Référence</th></tr></thead>
              <tbody>
                {tenants.map((tenant) => {
                  const status = TENANT_STATUS[tenant.status] ?? { label: tenant.status, tone: "neutral" };
                  return (
                    <tr key={tenant.id}>
                      <td><strong>{tenant.student_name}</strong></td>
                      <td>{tenant.listing_title}</td>
                      <td><span className={`pill pill-${status.tone}`}>{status.label}</span></td>
                      <td className="nowrap">{formatDate(tenant.created_at, true)}</td>
                      <td className="mono">{tenant.reference}</td>
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
