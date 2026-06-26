import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/login", "/auth/callback", "/auth/confirm"];
const AUTH_ROUTES = ["/login"];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Invite sayfası her zaman erişilebilir (davet token'ı doğrulanır sayfada)
  if (pathname.startsWith("/invite")) {
    return supabaseResponse;
  }

  // Public route: giriş yapmış kullanıcıyı role'e göre yönlendir
  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    if (user && AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
      const destination = getRoleDestination(
        user.user_metadata?.["platform_role"],
        request.cookies.get("aiq_role")?.value
      );
      return NextResponse.redirect(new URL(destination, request.url));
    }
    return supabaseResponse;
  }

  // Giriş yapılmamışsa login'e yönlendir
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Super admin guard — /admin routes
  if (pathname.startsWith("/admin")) {
    const platformRole = user.user_metadata?.["platform_role"];
    if (platformRole !== "super_admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return supabaseResponse;
  }

  // Membership bilgisini cookie'den oku, yoksa DB'den çek ve yaz
  const cachedRole = request.cookies.get("aiq_role")?.value;
  const cachedOrgId = request.cookies.get("aiq_org_id")?.value;

  if (!cachedRole || !cachedOrgId) {
    const { data: membership } = await supabase
      .from("memberships")
      .select("role, org_id, team_id")
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      // Üyeliği olmayan kullanıcı — login'e yönlendir
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "no_membership");
      return NextResponse.redirect(url);
    }

    const cookieOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 60 * 60 * 8, // 8 saat
    };

    supabaseResponse.cookies.set("aiq_role", membership.role, cookieOpts);
    supabaseResponse.cookies.set("aiq_org_id", membership.org_id, cookieOpts);
    if (membership.team_id) {
      supabaseResponse.cookies.set(
        "aiq_team_id",
        membership.team_id,
        cookieOpts
      );
    }
  }

  // /dashboard sadece admin rolüne açık
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    const role = supabaseResponse.cookies.get("aiq_role")?.value ?? cachedRole;
    if (role !== "admin") {
      const dest = role === "athlete" ? "/program" : "/athletes";
      return NextResponse.redirect(new URL(dest, request.url));
    }
  }

  // /settings sadece admin rolüne açık
  if (pathname.startsWith("/settings")) {
    const role = supabaseResponse.cookies.get("aiq_role")?.value ?? cachedRole;
    if (role !== "admin") {
      const dest = role === "athlete" ? "/program" : "/athletes";
      return NextResponse.redirect(new URL(dest, request.url));
    }
  }

  return supabaseResponse;
}

function getRoleDestination(
  platformRole?: string,
  membershipRole?: string
): string {
  if (platformRole === "super_admin") return "/admin";
  switch (membershipRole) {
    case "admin":
      return "/dashboard";
    case "coach":
      return "/athletes";
    case "athlete":
      return "/program";
    default:
      return "/";
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
