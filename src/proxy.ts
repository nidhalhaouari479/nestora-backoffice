import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";

const PUBLIC_PATHS = ["/login", "/session-expired", "/api/auth/", "/client/login"];
const REMEMBER_COOKIE = "nestora_remember";
// Keep in sync with lib/supabase/server.ts: the team and the client portal have separate sessions.
const AUTH_COOKIE = "nestora-ops-auth";
const CLIENT_AUTH_COOKIE = "nestora-client-auth";

// Refreshes the Supabase session cookies and sends anonymous visitors to the login page.
// Authorization (2FA, revoked session, role) is enforced again by requireStaff() on each page.
export async function proxy(request: NextRequest) {
  if (!publicEnv.supabaseUrl || !publicEnv.supabaseAnonKey) return NextResponse.next();
  let response = NextResponse.next({ request });
  const { pathname, searchParams } = request.nextUrl;
  const isClientPortal = pathname === "/client" || pathname.startsWith("/client/") || (pathname === "/api/auth/logout" && searchParams.get("to") === "client");
  const remember = request.cookies.get(REMEMBER_COOKIE)?.value === "1";

  const supabase = createServerClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    cookieOptions: { name: isClientPortal ? CLIENT_AUTH_COOKIE : AUTH_COOKIE },
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
  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  if (!data?.claims && !isPublic) {
    // Server Action calls follow redirects as fetch() and would receive an HTML page:
    // answer with a plain message the client can display instead.
    if (request.method === "POST" && request.headers.has("next-action")) {
      return new NextResponse("Ta session a expiré. Recharge la page et reconnecte-toi.", { status: 401, headers: { "content-type": "text/plain" } });
    }
    const url = request.nextUrl.clone();
    url.pathname = isClientPortal ? "/client/login" : "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};
