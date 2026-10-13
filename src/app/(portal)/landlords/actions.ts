"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { audit } from "@/lib/auth/audit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formValues, type ActionState } from "@/lib/forms";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function saveLandlordAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requirePermission("landlords.manage", "landlords");
  const id = text(formData, "id");
  const values = {
    full_name: text(formData, "full_name"),
    company_name: text(formData, "company_name") || null,
    phone: text(formData, "phone"),
    email: text(formData, "email").toLowerCase() || null,
    national_id: text(formData, "national_id") || null,
    address: text(formData, "address") || null,
    notes: text(formData, "notes"),
    is_active: formData.get("is_active") === "on",
  };

  const fieldErrors: Record<string, string> = {};
  if (values.full_name.length < 2) fieldErrors.full_name = "Nom complet obligatoire.";
  if (values.phone.replace(/\D/g, "").length < 8) fieldErrors.phone = "Numéro de téléphone invalide (8 chiffres minimum).";
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) fieldErrors.email = "Adresse email invalide.";
  if (Object.keys(fieldErrors).length) return { error: "Corrige les champs signalés.", fieldErrors, values: formValues(formData) };

  const supabase = await createSupabaseServerClient();
  const query = id
    ? supabase.from("landlords").update(values as never).eq("id", id).select("id").single()
    : supabase.from("landlords").insert({ ...values, created_by: staff.userId } as never).select("id").single();
  const { data, error } = await query;
  if (error || !data) return { error: "Enregistrement impossible. Vérifie tes droits et réessaie.", values: formValues(formData) };

  const savedId = (data as { id: string }).id;
  await audit(id ? "landlord_updated" : "landlord_created", staff.userId, "landlords", { landlord_id: savedId });
  revalidatePath("/landlords");
  redirect(`/landlords?saved=${id ? "updated" : "created"}`);
}
