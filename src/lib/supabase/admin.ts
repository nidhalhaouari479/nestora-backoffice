import { createClient } from "@supabase/supabase-js";
import { publicEnv, serverEnv } from "@/lib/env";

let client: ReturnType<typeof createClient> | undefined;

// Service-role client: bypasses RLS. Only used on the server for 2FA challenges,
// staff sessions and the audit log, which have no client-facing policies.
export function getSupabaseAdmin() {
  const { serviceRoleKey } = serverEnv();
  if (!publicEnv.supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }
  client ??= createClient(publicEnv.supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
