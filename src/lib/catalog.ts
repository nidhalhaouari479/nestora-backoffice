import { createSupabaseServerClient } from "@/lib/supabase/server";

// Reads for clients, faculties, features and houses. Reads use the staff session, so RLS decides what each role can see.

export * from "./catalog-shared";
import type { Faculty, Feature, Landlord, ListingDetail, ListingRow } from "./catalog-shared";

function escapeLike(value: string) {
  return value.replace(/[%_,()]/g, " ").trim();
}

export async function listLandlords({ q = "", status = "all" }: { q?: string; status?: string } = {}) {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("landlords").select("*, listings(count)").order("created_at", { ascending: false }).limit(200);
  if (status === "active") query = query.eq("is_active", true);
  if (status === "inactive") query = query.eq("is_active", false);
  const term = escapeLike(q);
  if (term) query = query.or(`full_name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%,reference.ilike.%${term}%`);
  const { data, error } = await query;
  if (error) throw new Error(`landlords: ${error.message}`);
  return (data ?? []) as (Landlord & { listings: { count: number }[] })[];
}

export async function getLandlord(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("landlords").select("*").eq("id", id).maybeSingle();
  return data as Landlord | null;
}

export async function listActiveLandlords() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("landlords").select("id, full_name, reference, phone, is_active").order("full_name");
  return (data ?? []) as Pick<Landlord, "id" | "full_name" | "reference" | "phone" | "is_active">[];
}

export async function listFaculties({ q = "" }: { q?: string } = {}) {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("universities").select("*, listing_universities(count)").order("sort_order").order("name");
  const term = escapeLike(q);
  if (term) query = query.or(`name.ilike.%${term}%,short_name.ilike.%${term}%,city.ilike.%${term}%`);
  const { data, error } = await query;
  if (error) throw new Error(`universities: ${error.message}`);
  return (data ?? []) as (Faculty & { listing_universities: { count: number }[] })[];
}

export async function getFaculty(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("universities").select("*").eq("id", id).maybeSingle();
  return data as Faculty | null;
}

export async function listListings({ q = "", status = "all", landlord = "", faculty = "" }: { q?: string; status?: string; landlord?: string; faculty?: string } = {}) {
  const supabase = await createSupabaseServerClient();
  const facultyJoin = faculty ? "listing_universities!inner" : "listing_universities";
  let query = supabase.from("listings")
    .select(`id, slug, title, listing_type, neighborhood, city, price_tnd, status, available_places, updated_at,
      landlords(id, full_name), ${facultyJoin}(university_id, universities(short_name, name)), listing_photos(url, sort_order)`)
    .order("updated_at", { ascending: false }).limit(200);
  if (status !== "all") query = query.eq("status", status);
  if (landlord) query = query.eq("landlord_id", landlord);
  if (faculty) query = query.eq("listing_universities.university_id", faculty);
  const term = escapeLike(q);
  if (term) query = query.or(`title.ilike.%${term}%,neighborhood.ilike.%${term}%,slug.ilike.%${term}%`);
  const { data, error } = await query;
  if (error) throw new Error(`listings: ${error.message}`);
  return (data ?? []) as unknown as ListingRow[];
}

export async function getListing(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("listings")
    .select("*, listing_universities(university_id), listing_photos(url, alt, position, sort_order), listing_feature_values(feature_id, value)")
    .eq("id", id).maybeSingle();
  return data as ListingDetail | null;
}

export async function listFeatures(kind?: string) {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("listing_features").select("*, listing_feature_values(count)").order("sort_order").order("name");
  if (kind) query = query.eq("kind", kind);
  const { data, error } = await query;
  if (error) throw new Error(`listing_features: ${error.message}`);
  return (data ?? []) as (Feature & { listing_feature_values: { count: number }[] })[];
}

export async function getFeature(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("listing_features").select("*").eq("id", id).maybeSingle();
  return data as Feature | null;
}
