"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { audit } from "@/lib/auth/audit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LISTING_STATUSES, LISTING_TYPES, slugify } from "@/lib/catalog";
import { formValues, type ActionState } from "@/lib/forms";
import { uploadPhoto, validatePhoto } from "@/lib/storage";

const MAX_PHOTOS = 8;
const BOOLEAN_FIELDS = [
  "service_included", "verified_onsite", "address_verified", "photos_verified", "landlord_verified",
  "is_furnished", "in_residence", "has_wifi", "has_ac", "has_heating", "has_desk",
] as const;

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function integer(formData: FormData, key: string) {
  const raw = text(formData, key);
  return raw === "" ? null : Number.isInteger(Number(raw)) ? Number(raw) : NaN;
}

export async function saveListingAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requirePermission("properties.manage", "properties");
  const id = text(formData, "id") || null;
  const fail = (error: string, fieldErrors?: Record<string, string>) => ({ error, fieldErrors, values: formValues(formData) });

  const title = text(formData, "title");
  const listingType = text(formData, "listing_type");
  const status = text(formData, "status") || "draft";
  const landlordId = text(formData, "landlord_id");
  const faculties = formData.getAll("faculties").map(String).filter(Boolean);
  const price = integer(formData, "price_tnd");
  const capacity = integer(formData, "capacity") ?? 1;
  const places = integer(formData, "available_places") ?? 1;
  const walk = integer(formData, "walk_minutes") ?? 10;
  const score = integer(formData, "confidence_score");
  const holdTotal = integer(formData, "hold_slots_total") ?? 3;
  const availableFrom = text(formData, "available_from");
  const keptPhotos = formData.getAll("keep_photos").map(String).filter(Boolean);
  const newPhotos = formData.getAll("photos").filter((file): file is File => file instanceof File && file.size > 0);

  const fieldErrors: Record<string, string> = {};
  if (title.length < 3) fieldErrors.title = "Titre obligatoire (3 caractères minimum).";
  if (!LISTING_TYPES.some((type) => type.value === listingType)) fieldErrors.listing_type = "Choisis un type de logement.";
  if (!LISTING_STATUSES.some((item) => item.value === status)) fieldErrors.status = "Statut invalide.";
  if (!landlordId) fieldErrors.landlord_id = "Choisis le client propriétaire de la maison.";
  if (faculties.length === 0) fieldErrors.faculties = "Choisis au moins une faculté.";
  if (!text(formData, "neighborhood")) fieldErrors.neighborhood = "Quartier obligatoire.";
  if (!price || price <= 0) fieldErrors.price_tnd = "Prix mensuel invalide.";
  if (!Number.isInteger(capacity) || capacity < 1) fieldErrors.capacity = "Capacité minimum : 1.";
  if (!Number.isInteger(places) || places < 0 || places > capacity) fieldErrors.available_places = "Entre 0 et la capacité.";
  if (!Number.isInteger(walk) || walk < 0) fieldErrors.walk_minutes = "Nombre de minutes invalide.";
  if (score !== null && (!Number.isInteger(score) || score < 0 || score > 100)) fieldErrors.confidence_score = "Score entre 0 et 100.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(availableFrom)) fieldErrors.available_from = "Date de disponibilité obligatoire.";
  if (keptPhotos.length + newPhotos.length > MAX_PHOTOS) fieldErrors.photos = `${MAX_PHOTOS} photos maximum.`;
  const photoError = newPhotos.map(validatePhoto).find(Boolean);
  if (photoError) fieldErrors.photos = photoError;
  if (status === "published" && keptPhotos.length + newPhotos.length === 0) fieldErrors.photos = "Ajoute au moins une photo avant de publier.";
  if (Object.keys(fieldErrors).length) return fail("Corrige les champs signalés.", fieldErrors);

  let uploaded: string[];
  try {
    uploaded = await Promise.all(newPhotos.map((file) => uploadPhoto("listings", file)));
  } catch {
    return fail("Les photos n’ont pas pu être envoyées. Réessaie.");
  }

  const data: Record<string, unknown> = {
    slug: slugify(text(formData, "slug") || title),
    title,
    short_title: text(formData, "short_title"),
    headline: text(formData, "headline"),
    tagline: text(formData, "tagline"),
    description: text(formData, "description"),
    listing_type: listingType,
    landlord_id: landlordId,
    neighborhood: text(formData, "neighborhood"),
    city: text(formData, "city"),
    maps_url: text(formData, "maps_url"),
    price_tnd: price,
    walk_minutes: walk,
    capacity,
    available_places: places,
    hold_slots_total: holdTotal,
    hold_slots_available: integer(formData, "hold_slots_available") ?? holdTotal,
    available_from: availableFrom,
    status,
    confidence_score: score === null ? "" : score,
    deposit_label: text(formData, "deposit_label"),
    charges_label: text(formData, "charges_label"),
    visits_label: text(formData, "visits_label"),
    collections: formData.getAll("collections").map(String),
  };
  BOOLEAN_FIELDS.forEach((field) => { data[field] = formData.get(field) === "on"; });

  const photos = [...keptPhotos, ...uploaded].map((url) => ({ url, alt: title }));
  const nearby = Object.fromEntries(["university", "transport", "cafe", "supermarket"].map((kind) => [kind, text(formData, `nearby_${kind}`)]));

  const supabase = await createSupabaseServerClient();
  const { data: savedId, error } = await supabase.rpc("admin_save_listing", {
    p_id: id, p_data: data, p_university_ids: faculties, p_photos: photos, p_nearby: nearby,
  } as never);
  if (error) {
    // Messages raised by admin_save_listing are already in French.
    return fail(error.code === "23514" || error.code === "P0002" ? error.message : "Enregistrement impossible. Vérifie tes droits et réessaie.");
  }

  await audit(id ? "listing_updated" : "listing_created", staff.userId, "properties", { listing_id: savedId, faculties, landlord_id: landlordId });
  revalidatePath("/properties");
  redirect(`/properties?saved=${id ? "updated" : "created"}`);
}
