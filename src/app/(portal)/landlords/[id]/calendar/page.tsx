import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireStaff } from "@/lib/auth/session";
import { getLandlord } from "@/lib/catalog";
import { getCalendarWeek, parseWeekStart } from "@/lib/calendar";
import { AvailabilityCalendar } from "@/components/calendar/AvailabilityCalendar";
import { landlordCalendarAction } from "../../../planning/actions";

export const metadata: Metadata = { title: "Calendrier du client" };

// The team consults (and, with landlords.manage, edits) the calendar the client manages from the client portal.
export default async function LandlordCalendarPage({ params, searchParams }: PageProps<"/landlords/[id]/calendar">) {
  const staff = await requireStaff("landlords");
  const { id } = await params;
  const landlord = await getLandlord(id);
  if (!landlord) notFound();
  const week = await getCalendarWeek(landlord.id, parseWeekStart((await searchParams).week), { showStudentNames: true });
  const canManage = staff.permissions.includes("landlords.manage");

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Clients · {landlord.reference}</p>
          <h2>Calendrier de {landlord.full_name}</h2>
          <p>Le client gère ce calendrier depuis son portail. Les étudiants ne voient que les créneaux libres ici ET dans le planning Nestora.</p>
        </div>
        <div className="page-actions">
          <Link href={`/landlords/${landlord.id}`} className="button-outline"><ArrowLeft size={16} aria-hidden="true" />Fiche client</Link>
        </div>
      </div>
      <AvailabilityCalendar
        week={week}
        basePath={`/landlords/${landlord.id}/calendar`}
        editable={canManage}
        action={canManage ? landlordCalendarAction.bind(null, landlord.id) : undefined}
        title="Disponibilités du client"
      />
    </div>
  );
}
