"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { audit } from "@/lib/auth/audit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { formValues, type ActionState } from "@/lib/forms";

// Values sent back to the form after an error, without the password.
function keptValues(formData: FormData) {
  const values = formValues(formData);
  delete values.portal_password;
  return values;
}

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

  const password = String(formData.get("portal_password") ?? "");

  const fieldErrors: Record<string, string> = {};
  if (values.full_name.length < 2) fieldErrors.full_name = "Nom complet obligatoire.";
  if (values.phone.replace(/\D/g, "").length < 8) fieldErrors.phone = "Numéro de téléphone invalide (8 chiffres minimum).";
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) fieldErrors.email = "Adresse email invalide.";
  if (password && password.length < 8) fieldErrors.portal_password = "8 caractères minimum.";
  if (password && !values.email) fieldErrors.email = "L’e-mail est obligatoire pour l’accès au portail client.";
  if (Object.keys(fieldErrors).length) return { error: "Corrige les champs signalés.", fieldErrors, values: keptValues(formData) };

  const supabase = await createSupabaseServerClient();
  const query = id
    ? supabase.from("landlords").update(values as never).eq("id", id).select("id").single()
    : supabase.from("landlords").insert({ ...values, created_by: staff.userId } as never).select("id").single();
  const { data, error } = await query;
  if (error || !data) return { error: "Enregistrement impossible. Vérifie tes droits et réessaie.", values: keptValues(formData) };

  const savedId = (data as { id: string }).id;

  const portal = await syncPortalAccount(savedId, values.email, password, values.full_name);
  if (portal.error) return { error: `Client enregistré, mais l’accès au portail n’a pas pu être mis à jour : ${portal.error}`, fieldErrors: portal.field ? { [portal.field]: portal.error } : undefined, values: keptValues(formData) };
  await audit(id ? "landlord_updated" : "landlord_created", staff.userId, "landlords", { landlord_id: savedId });
  revalidatePath("/landlords");
  redirect(`/landlords?saved=${id ? "updated" : "created"}`);
}

// Client portal account: e-mail + password chosen by the team (no e-mailed code).
// Creates the Auth account the first time a password is set, then keeps its e-mail in sync.
async function syncPortalAccount(landlordId: string, email: string | null, password: string, fullName: string): Promise<{ error?: string; field?: string }> {
  const admin = getSupabaseAdmin();
  const { data } = await admin.from("landlords").select("user_id").eq("id", landlordId).single();
  const userId = (data as { user_id: string | null } | null)?.user_id ?? null;

  if (!userId) {
    if (!password || !email) return {};
    // Never take over an existing student or staff account that already uses this e-mail.
    const { data: existing } = await admin.rpc("auth_user_id_by_email", { p_email: email } as never);
    if (typeof existing === "string") return { error: "Cet e-mail est déjà utilisé par un autre compte Nestora.", field: "email" };
    const { data: created, error } = await admin.auth.admin.createUser({
      email, password, email_confirm: true,
      app_metadata: { account_type: "landlord" }, user_metadata: { full_name: fullName },
    });
    if (error || !created.user) return { error: error?.code === "weak_password" ? "Mot de passe trop faible." : "Création du compte impossible.", field: "portal_password" };
    const { error: linkError } = await admin.from("landlords").update({ user_id: created.user.id } as never).eq("id", landlordId);
    return linkError ? { error: "Liaison du compte impossible." } : {};
  }

  const changes: { email?: string; password?: string; email_confirm?: boolean } = {};
  if (password) changes.password = password;
  if (email) {
    const { data: current } = await admin.auth.admin.getUserById(userId);
    if (current.user && current.user.email?.toLowerCase() !== email) { changes.email = email; changes.email_confirm = true; }
  }
  if (Object.keys(changes).length === 0) return {};
  const { error } = await admin.auth.admin.updateUserById(userId, changes);
  if (!error) return {};
  if (error.code === "email_exists") return { error: "Cet e-mail est déjà utilisé par un autre compte Nestora.", field: "email" };
  return { error: error.code === "weak_password" ? "Mot de passe trop faible." : "Mise à jour du compte impossible.", field: changes.password ? "portal_password" : "email" };
}
