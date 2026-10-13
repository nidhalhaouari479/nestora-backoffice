import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";

export const REMEMBER_COOKIE = "nestora_remember";

// Cookie-based Supabase client for Server Components, Server Actions and Route Handlers.
// Without "Rester connecté", auth cookies become browser-session cookies.
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const remember = cookieStore.get(REMEMBER_COOKIE)?.value === "1";

  return createServerClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
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
