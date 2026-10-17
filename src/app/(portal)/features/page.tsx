import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requireStaff } from "@/lib/auth/session";
import { FEATURE_KINDS, featureKind, listFeatures } from "@/lib/catalog";
import { Flash } from "@/components/admin/Flash";
import { FeatureIcon } from "@/components/admin/FeatureIcon";
import { DeleteFeatureButton } from "./DeleteFeatureButton";

export const metadata: Metadata = { title: "Caractéristiques" };

export default async function FeaturesPage({ searchParams }: PageProps<"/features">) {
  const staff = await requireStaff("features");
  const params = await searchParams;
  const kind = featureKind(typeof params.kind === "string" ? params.kind : "") ?? FEATURE_KINDS[0];
  const features = await listFeatures(kind.value);
  const canManage = staff.permissions.includes("properties.manage");

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Offre</p>
          <h2>Caractéristiques</h2>
          <p>Les listes proposées dans chaque maison : on active un élément et on saisit sa valeur dans la fiche maison.</p>
        </div>
        {canManage && (
          <div className="page-actions">
            <Link href={`/features/new?kind=${kind.value}`} className="button-dark"><Plus size={16} aria-hidden="true" />{kind.add}</Link>
          </div>
        )}
      </div>

      <nav className="tabs" aria-label="Listes">
        {FEATURE_KINDS.map((item) => (
          <Link key={item.value} href={`/features?kind=${item.value}`} className="tab" aria-current={item.value === kind.value ? "page" : undefined}>{item.label}</Link>
        ))}
      </nav>

      <Flash saved={params.saved} />

      <section className="panel table-panel">
        {features.length === 0 ? (
          <p className="panel-empty">Aucun élément dans cette liste.</p>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr><th>Nom</th><th>Ordre</th><th>Maisons</th><th>Statut</th><th><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody>
                {features.map((feature) => {
                  const houses = feature.listing_feature_values[0]?.count ?? 0;
                  return (
                    <tr key={feature.id}>
                      <td>
                        <span className="cell-with-thumb">
                          <span className="feature-icon"><FeatureIcon name={feature.icon} size={18} /></span>
                          <strong>{feature.name}</strong>
                        </span>
                      </td>
                      <td className="muted">{feature.sort_order}</td>
                      <td>{houses}</td>
                      <td><span className={`pill ${feature.is_active ? "pill-success" : "pill-neutral"}`}>{feature.is_active ? "Visible" : "Masquée"}</span></td>
                      <td className="table-actions">
                        {canManage && (
                          <span className="action-group">
                            <Link href={`/features/${feature.id}`} className="table-link">Modifier</Link>
                            <DeleteFeatureButton id={feature.id} kind={feature.kind} name={feature.name} houses={houses} />
                          </span>
                        )}
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
