import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";

export const REMEMBER_COOKIE = "nestora_remember";
// Own cookie names: on localhost every app shares cookies, and the team portal and the client
// portal keep separate sessions, so opening one never signs the other out.
export const AUTH_COOKIE = "nestora-ops-auth";
export const CLIENT_AUTH_COOKIE = "nestora-client-auth";

export type SessionScope = "staff" | "client";

// Cookie-based Supabase client for Server Components, Server Actions and Route Handlers.
// Without "Rester connecté", auth cookies become browser-session cookies.
export async function createSupabaseServerClient(scope: SessionScope = "staff") {
  const cookieStore = await cookies();
  const remember = cookieStore.get(REMEMBER_COOKIE)?.value === "1";

  return createServerClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    cookieOptions: { name: scope === "client" ? CLIENT_AUTH_COOKIE : AUTH_COOKIE },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            const sessionOnly = !remember && value !== "";
            cookieStore.set(name, value, sessionOnly ? { ...options, maxAge: undefined, expires: undefined } : options);
          });
        } catch {
          // Called from a Server Component: the proxy refreshes the cookies instead.
        }
      },
    },
  });
}
