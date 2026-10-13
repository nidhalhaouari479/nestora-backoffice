import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";

const PUBLIC_PATHS = ["/login", "/session-expired", "/api/auth/"];
const REMEMBER_COOKIE = "nestora_remember";

// Refreshes the Supabase session cookies and sends anonymous visitors to the login page.
// Authorization (2FA, idle timeout, role) is enforced again by requireStaff() on each page.
export async function proxy(request: NextRequest) {
  if (!publicEnv.supabaseUrl || !publicEnv.supabaseAnonKey) return NextResponse.next();
  let response = NextResponse.next({ request });
  const remember = request.cookies.get(REMEMBER_COOKIE)?.value === "1";

  const supabase = createServerClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          const sessionOnly = !remember && value !== "";
          response.cookies.set(name, value, sessionOnly ? { ...options, maxAge: undefined, expires: undefined } : options);
        });
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const isPublic = PUBLIC_PATHS.some((path) => request.nextUrl.pathname.startsWith(path));

  if (!data?.claims && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};
