import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth/session";
import { getCalendarWeek, parseWeekStart } from "@/lib/calendar";
import { AvailabilityCalendar } from "@/components/calendar/AvailabilityCalendar";
import { nestoraCalendarAction } from "./actions";

export const metadata: Metadata = { title: "Planning" };

// Nestora team calendar, 8:00 → 19:00. Confirmed visits appear in green automatically.
export default async function PlanningPage({ searchParams }: PageProps<"/planning">) {
  const staff = await requireStaff("planning");
  const week = await getCalendarWeek(null, parseWeekStart((await searchParams).week), { showStudentNames: true });
  const canManage = staff.permissions.includes("planning.manage");

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Contrôle</p>
          <h2>Planning Nestora</h2>
          <p>Les disponibilités de l’équipe pour les visites. Un étudiant ne peut demander qu’un créneau libre ici ET dans le calendrier du client.</p>
        </div>
      </div>
      <AvailabilityCalendar week={week} basePath="/planning" editable={canManage} action={canManage ? nestoraCalendarAction : undefined} title="Planning de l’équipe" />
    </div>
  );
}
