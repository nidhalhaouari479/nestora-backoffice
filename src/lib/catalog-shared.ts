// Constants and types usable from both server and client components.

export const LISTING_TYPES = [
  { value: "s0", label: "S+0 (studio)" },
  { value: "s1", label: "S+1" },
  { value: "s2", label: "S+2" },
  { value: "s3", label: "S+3" },
  { value: "private_room", label: "Chambre privée" },
  { value: "private_foyer", label: "Foyer privé" },
] as const;

export const LISTING_STATUSES = [
  { value: "draft", label: "Brouillon", tone: "neutral" },
  { value: "published", label: "Publiée", tone: "success" },
  { value: "rented", label: "Louée", tone: "info" },
  { value: "archived", label: "Archivée", tone: "warning" },
] as const;

export const LISTING_GENDERS = [
  { value: "girls", label: "Filles" },
  { value: "boys", label: "Garçons" },
  { value: "all", label: "Tous" },
] as const;

// Lists managed on the "Caractéristiques" page; each house turns items on and fills a value.
// value: "minutes" = number required, "required" = text required, "optional" = text optional, "none" = no value.
export const FEATURE_KINDS = [
  { value: "nearby", label: "À proximité", add: "Ajouter une proximité", input: "minutes", valueLabel: "Minutes" },
  { value: "equipment", label: "Équipements", add: "Ajouter un équipement", input: "optional", valueLabel: "Précision (optionnelle)" },
  { value: "condition", label: "Conditions", add: "Ajouter une condition", input: "required", valueLabel: "Valeur" },
  { value: "highlight", label: "Mise en avant sur l’accueil", add: "Ajouter une mise en avant", input: "none", valueLabel: "" },
] as const;

export type FeatureKind = (typeof FEATURE_KINDS)[number]["value"];

export function featureKind(value: string) {
  return FEATURE_KINDS.find((kind) => kind.value === value);
}

export type Feature = {
  id: string;
  kind: FeatureKind;
  code: string;
  name: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
};

export type ListingStatus = (typeof LISTING_STATUSES)[number]["value"];
export type ListingType = (typeof LISTING_TYPES)[number]["value"];

export function listingTypeLabel(value: string) {
  return LISTING_TYPES.find((type) => type.value === value)?.label ?? value;
}

export function listingStatus(value: string) {
  return LISTING_STATUSES.find((status) => status.value === value) ?? LISTING_STATUSES[0];
}

export function slugify(value: string) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "maison";
}

export type Landlord = {
  id: string;
  reference: string;
  full_name: string;
  company_name: string | null;
  phone: string;
  email: string | null;
  national_id: string | null;
  address: string | null;
  notes: string;
  is_active: boolean;
  created_at: string;
};

export type Faculty = {
  id: string;
  name: string;
  short_name: string | null;
  city: string;
  areas: string[];
  image_url: string | null;
  image_position: string;
  sort_order: number;
  is_active: boolean;
};

export type ListingRow = {
  id: string;
  slug: string;
  title: string;
  listing_type: string;
  neighborhood: string;
  city: string;
  price_tnd: number;
  status: string;
  available_places: number;
  updated_at: string;
  landlords: { id: string; full_name: string } | null;
  listing_universities: { university_id: string; universities: { short_name: string | null; name: string } | null }[];
  listing_photos: { url: string; sort_order: number }[];
};

export type ListingDetail = {
  id: string;
  slug: string;
  title: string;
  short_title: string;
  headline: string;
  tagline: string;
  description: string;
  listing_type: string;
  landlord_id: string | null;
  neighborhood: string;
  city: string;
  maps_url: string | null;
  price_tnd: number;
  sale_price_tnd: number | null;
  gender: string;
  service_included: boolean;
  walk_minutes: number;
  capacity: number;
  available_places: number;
  hold_slots_total: number;
  hold_slots_available: number;
  available_from: string;
  status: string;
  verified_onsite: boolean;
  address_verified: boolean;
  photos_verified: boolean;
  landlord_verified: boolean;
  confidence_score: number | null;
  listing_universities: { university_id: string }[];
  listing_photos: { url: string; alt: string; position: string; sort_order: number }[];
  listing_feature_values: { feature_id: string; value: string }[];
};
