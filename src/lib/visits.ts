import { createSupabaseServerClient } from "@/lib/supabase/server";

// Visit requests sent from the website: the student proposes 1 to 7 days (one slot each)
// and the team picks the final date among them (staff_confirm_visit).

export type VisitProposal = { date: string; start: string; end: string };

export type VisitRow = {
  id: string;
  reference: string;
  status: string;
  proposed_slots: VisitProposal[];
  confirmed_date: string | null;
  slot_start: string;
  slot_end: string;
  confirmed_at: string | null;
  created_at: string;
  listing_id: string;
  listing_title: string;
  listing_neighborhood: string;
  student_profile_id: string | null;
  student_name: string | null;
  student_email: string | null;
  student_phone: string | null;
};

export const VISIT_FILTERS = [
  { value: "pending", label: "À traiter" },
  { value: "confirmed", label: "Confirmées" },
  { value: "completed", label: "Effectuées" },
  { value: "cancelled", label: "Annulées" },
  { value: "all", label: "Toutes" },
] as const;

export function isPendingVisit(status: string) {
  return status === "requested" || status === "slot_confirmation";
}

// "mer. 1 oct." — dates are plain YYYY-MM-DD, read at noon UTC so the day never shifts.
export function formatVisitDay(isoDate: string) {
  return new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" }).format(new Date(`${isoDate}T12:00:00Z`));
}

export function formatSlot(start: string, end: string) {
  return `${start.slice(0, 5)} – ${end.slice(0, 5)}`;
}

export async function listVisits(status = "pending") {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("staff_list_visits", { p_status: status } as never);
  if (error) throw new Error(`staff_list_visits: ${error.message}`);
  return (data ?? []) as VisitRow[];
}
