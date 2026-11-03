"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { audit } from "@/lib/auth/audit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function back(formData: FormData, query: string) {
  const filter = text(formData, "filter") || "pending";
  redirect(`/visits?filter=${encodeURIComponent(filter)}&${query}`);
}

// The admin keeps one of the dates proposed by the student; the database checks it is one of them.
export async function confirmVisitAction(formData: FormData) {
  const staff = await requirePermission("visits.view", "visits");
  const id = text(formData, "id");
  const date = text(formData, "date");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) back(formData, `error=${encodeURIComponent("Choisis la date finale parmi les propositions.")}&visit=${id}`);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("staff_confirm_visit", { p_id: id, p_date: date } as never);
  if (error) back(formData, `error=${encodeURIComponent(error.code === "42501" ? "Tu n’as pas le droit de confirmer cette visite." : error.message)}&visit=${id}`);

  await audit("visit_confirmed", staff.userId, "visits", { visit_id: id, date });
  revalidatePath("/visits");
  back(formData, "saved=confirmed");
}

export async function cancelVisitAction(formData: FormData) {
  const staff = await requirePermission("visits.view", "visits");
  const id = text(formData, "id");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("staff_cancel_visit", { p_id: id } as never);
  if (error) back(formData, `error=${encodeURIComponent(error.code === "42501" ? "Tu n’as pas le droit d’annuler cette visite." : error.message)}&visit=${id}`);

  await audit("visit_cancelled", staff.userId, "visits", { visit_id: id });
  revalidatePath("/visits");
  back(formData, "saved=cancelled");
}

// Chooser (proposal or another one-hour slot). Returns a result instead of redirecting.
export async function chooseVisitSlotAction(formData: FormData): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  const staff = await requirePermission("visits.view", "visits");
  const id = text(formData, "id");
  const date = text(formData, "date");
  const hour = Number(formData.get("hour"));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isInteger(hour)) return { ok: false, error: "Choisis une date et une heure." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("staff_confirm_visit_at", { p_id: id, p_date: date, p_hour: hour } as never);
  if (error) return { ok: false, error: error.code === "42501" ? "Tu n’as pas le droit de confirmer cette visite." : error.message };

  await audit("visit_confirmed", staff.userId, "visits", { visit_id: id, date, hour });
  revalidatePath("/visits");
  revalidatePath("/planning");
  return { ok: true, message: "Visite confirmée. Elle apparaît en vert dans les calendriers." };
}
