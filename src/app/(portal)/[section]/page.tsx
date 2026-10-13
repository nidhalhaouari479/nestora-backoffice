import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth/session";
import { findSection, homeFor } from "@/lib/auth/permissions";

export async function generateMetadata({ params }: PageProps<"/[section]">): Promise<Metadata> {
  return { title: findSection((await params).section)?.label ?? "Module" };
}

// Modules planned for the next phases. Access is already checked per role (AP1A_18).
export default async function SectionPage({ params }: PageProps<"/[section]">) {
  const { section: slug } = await params;
  const section = findSection(slug);
  if (!section) notFound();
  const staff = await requireStaff(section.slug);

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Module</p>
          <h2>{section.label}</h2>
          <p>Ce module arrive dans une prochaine phase du portail.</p>
        </div>
      </div>
      <section className="panel coming-soon">
        <p>Les écrans « {section.label} » seront livrés avec les prochaines maquettes. Ton accès à ce module est déjà configuré pour le rôle <b>{staff.roleLabel}</b>.</p>
        <Link href={`/${homeFor(staff.permissions)}`} className="button-dark">Retour à mon espace</Link>
      </section>
    </div>
  );
}
