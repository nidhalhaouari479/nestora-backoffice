"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { audit } from "@/lib/auth/audit";
import { requireLandlord } from "@/lib/auth/landlord";
import { CLIENT_CALENDAR_PERMISSIONS, runCalendarChange, type CalendarActionResult } from "@/lib/calendar-actions";

export type ClientFormState = { error?: string } | undefined;

// Client portal sign-in: e-mail + password set by the team on the client record. No code.
export async function clientLoginAction(_state: ClientFormState, formData: FormData): Promise<ClientFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Renseigne ton adresse e-mail et ton mot de passe." };

  const supabase = await createSupabaseServerClient("client");
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    await audit("client_login_failed", null, "client", { email, reason: error?.code ?? "unknown" });
    return { error: error?.status === 429 ? "Trop de tentatives. Patiente quelques minutes." : "Adresse e-mail ou mot de passe incorrect." };
  }

  const { data: landlord } = await getSupabaseAdmin().from("landlords").select("id").eq("user_id", data.user.id).eq("is_active", true).maybeSingle();
  if (!landlord) {
    await supabase.auth.signOut({ scope: "local" });
    return { error: "Ce compte n’a pas accès à l’espace client." };
  }
  await audit("client_login_success", data.user.id, "client", { landlord_id: (landlord as { id: string }).id });
  redirect("/client");
}

// The client edits only their own calendar: the id comes from the session, never from the form.
export async function clientCalendarAction(formData: FormData): Promise<CalendarActionResult> {
  const account = await requireLandlord();
  const result = await runCalendarChange(account.id, formData, account.userId, CLIENT_CALENDAR_PERMISSIONS);
  if (result.ok) {
    await audit("client_calendar_updated", account.userId, "client", { landlord_id: account.id, op: String(formData.get("op") ?? "") });
    revalidatePath("/client", "layout");
  }
  return result;
}

function parseSlot(formData: FormData) {
  const date = String(formData.get("date") ?? "");
  const hour = Number(formData.get("hour"));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isInteger(hour)) return null;
  return { id: String(formData.get("id") ?? ""), date, hour };
}

// The client accepts a proposed slot or picks another one for a visit of one of their houses.
export async function clientConfirmVisitAction(formData: FormData): Promise<CalendarActionResult> {
  const account = await requireLandlord();
  const slot = parseSlot(formData);
  if (!slot) return { ok: false, error: "Choisis une date et une heure." };
  const { error } = await getSupabaseAdmin().rpc("landlord_confirm_visit", { p_landlord_id: account.id, p_id: slot.id, p_date: slot.date, p_hour: slot.hour } as never);
  if (error) return { ok: false, error: error.code === "42501" ? "Cette demande ne concerne pas une de tes maisons." : error.message };
  await audit("visit_confirmed", account.userId, "client", { visit_id: slot.id, date: slot.date, hour: slot.hour, by: "landlord" });
  revalidatePath("/client", "layout");
  return { ok: true, message: "Visite confirmée. Elle apparaît en vert dans ton calendrier." };
}
