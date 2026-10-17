import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/session";
import { FEATURE_KINDS, featureKind } from "@/lib/catalog";
import { FeatureForm } from "../FeatureForm";

export const metadata: Metadata = { title: "Nouvelle caractéristique" };

export default async function NewFeaturePage({ searchParams }: PageProps<"/features/new">) {
  await requirePermission("properties.manage", "features");
  const params = await searchParams;
  const kind = featureKind(typeof params.kind === "string" ? params.kind : "") ?? FEATURE_KINDS[0];

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Caractéristiques · {kind.label}</p>
          <h2>Ajouter un élément</h2>
          <p>Il pourra ensuite être activé dans chaque maison.</p>
        </div>
      </div>
      <FeatureForm kind={kind.value} />
    </div>
  );
}
