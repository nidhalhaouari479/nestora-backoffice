import { cache } from "react";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getAuthUser } from "./session";

export type LandlordAccount = { id: string; userId: string; fullName: string; companyName: string | null; email: string; reference: string };

type LandlordRow = { id: string; user_id: string; full_name: string; company_name: string | null; email: string | null; reference: string };

// Client (landlord) signed in to the client portal: an active landlord linked to this Auth user.
export const getLandlordAccount = cache(async (): Promise<LandlordAccount | null> => {
  const auth = await getAuthUser("client");
  if (!auth) return null;
  const { data } = await getSupabaseAdmin().from("landlords")
    .select("id, user_id, full_name, company_name, email, reference")
    .eq("user_id", auth.userId).eq("is_active", true).maybeSingle();
  const row = data as LandlordRow | null;
  if (!row) return null;
  return { id: row.id, userId: row.user_id, fullName: row.full_name, companyName: row.company_name, email: row.email ?? auth.email, reference: row.reference };
});

export async function requireLandlord() {
  const account = await getLandlordAccount();
  if (!account) redirect("/client/login");
  return account;
}
