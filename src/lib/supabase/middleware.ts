import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isGuideRequest, isPublicPath } from "@/lib/auth-routes";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { safeNextPath } from "@/lib/movement-access";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function updateSession(request: NextRequest) {
  // Testing local: sin login ni sync de sesión.
  if (isFeatureEnabled("skipAuth") || !isSupabaseConfigured()) {
    if (request.nextUrl.pathname === "/login") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next({ request });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const guideOnly = isGuideRequest(pathname, request.nextUrl.searchParams);

  if (!user && !isPublicPath(pathname) && !guideOnly) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    const next = `${pathname}${request.nextUrl.search}`;
    if (next && next !== "/") {
      loginUrl.searchParams.set("next", next);
    }
    return NextResponse.redirect(loginUrl);
  }

  if (user && pathname === "/login") {
    let next = safeNextPath(request.nextUrl.searchParams.get("next"));
    if (next === "/login") next = "/";
    return NextResponse.redirect(new URL(next, request.url));
  }

  return supabaseResponse;
}
