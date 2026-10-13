import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/session";
import { FacultyForm } from "../FacultyForm";

export const metadata: Metadata = { title: "Nouvelle faculté" };

export default async function NewFacultyPage() {
  await requirePermission("universities.manage", "universities");
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Facultés</p>
          <h2>Nouvelle faculté</h2>
          <p>Elle apparaîtra dans le choix de l’université de l’application étudiante.</p>
        </div>
      </div>
      <FacultyForm />
    </div>
  );
}
