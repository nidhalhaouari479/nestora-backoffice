import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { todayInTunis } from "@/lib/calendar";
import { addDays } from "@/lib/calendar-shared";

// Client portal data. Every query is scoped to the signed-in client's houses (landlord_id),
// checked by requireLandlord() before these functions are called. Uses the service role.

export type ClientHouse = {
  id: string; title: string; neighborhood: string; city: string; status: string;
  price_tnd: number; capacity: number; available_places: number; cover: string | null;
};
export type ClientVisit = {
  id: string; reference: string; status: string; listing_id: string; listing_title: string; student_first_name: string;
  proposed_slots: { date: string; start: string; end: string }[];
  confirmed_date: string | null; slot_start: string; slot_end: string; created_at: string;
};
export type ClientTenant = { id: string; reference: string; student_name: string; status: string; listing_id: string; listing_title: string; created_at: string };

export const PENDING_VISIT = ["requested", "slot_confirmation"];
export const TENANT_ACTIVE = ["contract", "move_in"];
export const TENANT_IN_PROGRESS = ["open", "payment_review"];

export const TENANT_STATUS: Record<string, { label: string; tone: string }> = {
  open: { label: "Dossier ouvert", tone: "info" },
  payment_review: { label: "Paiement en vérification", tone: "warning" },
  contract: { label: "Contrat", tone: "success" },
  move_in: { label: "Emménagé", tone: "success" },
  closed: { label: "Terminé", tone: "neutral" },
  cancelled: { label: "Annulé", tone: "danger" },
};

export const LISTING_STATUS: Record<string, { label: string; tone: string }> = {
  published: { label: "En ligne", tone: "success" },
  draft: { label: "Brouillon", tone: "neutral" },
  archived: { label: "Archivée", tone: "neutral" },
  rented: { label: "Louée", tone: "info" },
};

export async function listClientHouses(landlordId: string): Promise<ClientHouse[]> {
  const { data, error } = await getSupabaseAdmin().from("listings")
    .select("id, title, neighborhood, city, status, price_tnd, capacity, available_places, listing_photos(url, sort_order)")
    .eq("landlord_id", landlordId).order("title");
  if (error) throw new Error(`listings: ${error.message}`);
  return ((data ?? []) as (Omit<ClientHouse, "cover"> & { listing_photos: { url: string; sort_order: number }[] })[]).map(({ listing_photos, ...house }) => ({
    ...house,
    cover: [...(listing_photos ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0]?.url ?? null,
  }));
}

async function houseIds(landlordId: string) {
  const { data } = await getSupabaseAdmin().from("listings").select("id, title").eq("landlord_id", landlordId);
  return new Map(((data ?? []) as { id: string; title: string }[]).map((row) => [row.id, row.title]));
}

export async function listClientVisits(landlordId: string): Promise<ClientVisit[]> {
  const titles = await houseIds(landlordId);
  if (titles.size === 0) return [];
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.from("visit_requests")
    .select("id, reference, status, listing_id, student_id, proposed_slots, confirmed_date, slot_start, slot_end, created_at")
    .in("listing_id", [...titles.keys()]).order("created_at", { ascending: false }).limit(200);
  if (error) throw new Error(`visit_requests: ${error.message}`);
  const rows = (data ?? []) as (Omit<ClientVisit, "listing_title" | "student_first_name"> & { student_id: string })[];

  // Only the student's first name is shared with the client.
  const { data: profiles } = rows.length
    ? await admin.from("student_profiles").select("user_id, first_name").in("user_id", [...new Set(rows.map((row) => row.student_id))])
    : { data: [] };
  const names = new Map(((profiles ?? []) as { user_id: string; first_name: string }[]).map((row) => [row.user_id, row.first_name]));

  return rows.map(({ student_id, ...row }) => ({
    ...row,
    listing_title: titles.get(row.listing_id) ?? "Maison",
    student_first_name: names.get(student_id) || "Étudiant",
    proposed_slots: Array.isArray(row.proposed_slots) ? row.proposed_slots : [],
  }));
}

export async function listClientTenants(landlordId: string): Promise<ClientTenant[]> {
  const titles = await houseIds(landlordId);
  if (titles.size === 0) return [];
  const { data, error } = await getSupabaseAdmin().from("rental_cases")
    .select("id, reference, student_name, status, listing_id, created_at")
    .in("listing_id", [...titles.keys()]).neq("status", "cancelled").order("created_at", { ascending: false });
  if (error) throw new Error(`rental_cases: ${error.message}`);
  return ((data ?? []) as Omit<ClientTenant, "listing_title">[]).map((row) => ({ ...row, listing_title: titles.get(row.listing_id) ?? "Maison" }));
}

export async function countPendingVisits(landlordId: string) {
  const titles = await houseIds(landlordId);
  if (titles.size === 0) return 0;
  const { count } = await getSupabaseAdmin().from("visit_requests").select("id", { count: "exact", head: true })
    .in("listing_id", [...titles.keys()]).in("status", PENDING_VISIT);
  return count ?? 0;
}

// Free = open in the Nestora calendar AND in this client's calendar (calendar_slot_free).
export async function slotFreeness(landlordId: string | null, slots: { date: string; hour: number }[]) {
  const admin = getSupabaseAdmin();
  const results = await Promise.all(slots.map(async (slot) => {
    const { data, error } = await admin.rpc("calendar_slot_free", { p_landlord_id: landlordId, p_day: slot.date, p_hour: slot.hour } as never);
    return [`${slot.date}|${slot.hour}`, !error && data === true] as const;
  }));
  return new Map(results);
}

export function visitWindow() {
  const today = todayInTunis();
  return { today, max: addDays(today, 30) };
}
