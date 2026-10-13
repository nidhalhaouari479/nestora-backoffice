import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { getFaculty } from "@/lib/catalog";
import { FacultyForm } from "../FacultyForm";

export const metadata: Metadata = { title: "Modifier la faculté" };

export default async function EditFacultyPage({ params }: PageProps<"/universities/[id]">) {
  await requirePermission("universities.manage", "universities");
  const faculty = await getFaculty((await params).id);
  if (!faculty) notFound();

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Facultés · {faculty.id}</p>
          <h2>{faculty.short_name ?? faculty.name}</h2>
          <p>{faculty.name}</p>
        </div>
      </div>
      <FacultyForm faculty={faculty} />
    </div>
  );
}
