import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { featureKind, getFeature } from "@/lib/catalog";
import { FeatureForm } from "../FeatureForm";

export const metadata: Metadata = { title: "Modifier la caractéristique" };

export default async function EditFeaturePage({ params }: PageProps<"/features/[id]">) {
  await requirePermission("properties.manage", "features");
  const feature = await getFeature((await params).id);
  if (!feature) notFound();

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Caractéristiques · {featureKind(feature.kind)?.label}</p>
          <h2>{feature.name}</h2>
        </div>
      </div>
      <FeatureForm feature={feature} kind={feature.kind} />
    </div>
  );
}
