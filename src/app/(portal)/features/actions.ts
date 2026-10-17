"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { audit } from "@/lib/auth/audit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { featureKind, slugify } from "@/lib/catalog";
import { formValues, type ActionState } from "@/lib/forms";
import { FEATURE_ICONS } from "@/components/admin/FeatureIcon";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function saveFeatureAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requirePermission("properties.manage", "features");
  const id = text(formData, "id");
  const kind = text(formData, "kind");
  const name = text(formData, "name");
  const icon = text(formData, "icon");
  const fail = (error: string, fieldErrors?: Record<string, string>) => ({ error, fieldErrors, values: formValues(formData) });

  const fieldErrors: Record<string, string> = {};
  if (!featureKind(kind)) fieldErrors.kind = "Choisis une liste.";
  if (name.length < 2) fieldErrors.name = "Nom obligatoire (2 caractères minimum).";
  if (!FEATURE_ICONS[icon]) fieldErrors.icon = "Choisis une icône.";
  if (Object.keys(fieldErrors).length) return fail("Corrige les champs signalés.", fieldErrors);

  const values = { name, icon, sort_order: Number(text(formData, "sort_order")) || 0, is_active: formData.get("is_active") === "on" };
  const supabase = await createSupabaseServerClient();

  if (id) {
    const { error } = await supabase.from("listing_features").update(values as never).eq("id", id);
    if (error) return fail("Enregistrement impossible. Vérifie tes droits et réessaie.");
  } else {
    // Stable code used by the student app: "Machine à laver" → machine-a-laver, machine-a-laver-2…
    const base = slugify(name);
    const { data: taken } = await supabase.from("listing_features").select("code").eq("kind", kind).like("code", `${base}%`);
    const codes = new Set(((taken ?? []) as { code: string }[]).map((row) => row.code));
    let code = base;
    for (let suffix = 2; codes.has(code); suffix++) code = `${base}-${suffix}`;
    const { error } = await supabase.from("listing_features").insert({ kind, code, ...values } as never);
    if (error) return fail("Enregistrement impossible. Vérifie tes droits et réessaie.");
  }

  await audit(id ? "feature_updated" : "feature_created", staff.userId, "features", { kind, name });
  revalidatePath("/features");
  redirect(`/features?kind=${kind}&saved=${id ? "updated" : "created"}`);
}

export async function deleteFeatureAction(formData: FormData) {
  const staff = await requirePermission("properties.manage", "features");
  const id = text(formData, "id");
  const kind = text(formData, "kind");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("listing_features").delete().eq("id", id);
  if (error) throw new Error("Suppression impossible. Vérifie tes droits et réessaie.");
  await audit("feature_deleted", staff.userId, "features", { feature_id: id, kind });
  revalidatePath("/features");
  redirect(`/features?kind=${kind}&saved=deleted`);
}
