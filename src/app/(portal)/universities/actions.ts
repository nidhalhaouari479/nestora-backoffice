"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { audit } from "@/lib/auth/audit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/catalog";
import { formValues, type ActionState } from "@/lib/forms";
import { uploadPhoto, validatePhoto } from "@/lib/storage";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function saveFacultyAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requirePermission("universities.manage", "universities");
  const id = text(formData, "id");
  const name = text(formData, "name");
  const shortName = text(formData, "short_name");
  const image = formData.get("image");
  const fail = (error: string, fieldErrors?: Record<string, string>) => ({ error, fieldErrors, values: formValues(formData) });

  const fieldErrors: Record<string, string> = {};
  if (name.length < 2) fieldErrors.name = "Nom de la faculté obligatoire.";
  if (shortName.length < 2) fieldErrors.short_name = "Nom court obligatoire (affiché dans l’application).";
  const hasImage = image instanceof File && image.size > 0;
  const imageError = hasImage ? validatePhoto(image) : null;
  if (imageError) fieldErrors.image = imageError;
  if (Object.keys(fieldErrors).length) return fail("Corrige les champs signalés.", fieldErrors);

  let imageUrl = text(formData, "image_url") || null;
  if (hasImage) {
    try {
      imageUrl = await uploadPhoto("universities", image);
    } catch {
      return fail("L’image n’a pas pu être envoyée. Réessaie.");
    }
  }

  const values = {
    name,
    short_name: shortName,
    city: text(formData, "city") || "Tunis",
    areas: text(formData, "areas").split(",").map((area) => area.trim()).filter(Boolean),
    image_url: imageUrl,
    image_position: text(formData, "image_position") || "center",
    sort_order: Number(text(formData, "sort_order")) || 0,
    is_active: formData.get("is_active") === "on",
  };

  const supabase = await createSupabaseServerClient();
  if (id) {
    const { error } = await supabase.from("universities").update(values as never).eq("id", id);
    if (error) return fail("Enregistrement impossible. Vérifie tes droits et réessaie.");
  } else {
    const newId = slugify(shortName || name);
    const { error } = await supabase.from("universities").insert({ id: newId, ...values } as never);
    if (error) return fail(error.code === "23505" ? "Une faculté avec ce nom court existe déjà." : "Enregistrement impossible. Vérifie tes droits et réessaie.", error.code === "23505" ? { short_name: "Déjà utilisé." } : undefined);
  }

  await audit(id ? "faculty_updated" : "faculty_created", staff.userId, "universities", { faculty: id || slugify(shortName || name) });
  revalidatePath("/universities");
  redirect(`/universities?saved=${id ? "updated" : "created"}`);
}
