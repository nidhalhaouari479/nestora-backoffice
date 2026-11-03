import type { Metadata } from "next";
import { requireLandlord } from "@/lib/auth/landlord";
import { getCalendarWeek, parseWeekStart } from "@/lib/calendar";
import { CLIENT_CALENDAR_PERMISSIONS } from "@/lib/calendar-actions";
import { AvailabilityCalendar } from "@/components/calendar/AvailabilityCalendar";
import { clientCalendarAction } from "../../actions";

export const metadata: Metadata = { title: "Mon calendrier" };

export default async function ClientCalendarPage({ searchParams }: PageProps<"/client/calendrier">) {
  const account = await requireLandlord();
  // Student names stay private: the client sees "Visite · <maison>".
  const week = await getCalendarWeek(account.id, parseWeekStart((await searchParams).week), { showStudentNames: false });

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <h2>Mon calendrier</h2>
          <p>Marque en rouge les créneaux où ta maison ne peut pas être visitée. Les visites confirmées apparaissent en vert automatiquement ; les étudiants ne peuvent demander que les créneaux libres.</p>
        </div>
      </div>
      <AvailabilityCalendar
        week={week}
        basePath="/client/calendrier"
        editable
        action={clientCalendarAction}
        title="Mon calendrier de visites"
        paintKinds={CLIENT_CALENDAR_PERMISSIONS.paintKinds}
        selectableKinds={["open", "blocked"]}
        ruleKinds={["blocked"]}
      />
    </div>
  );
}
