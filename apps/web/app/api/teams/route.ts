import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import type { CookieOptions } from "@supabase/ssr";

export async function POST(request: NextRequest) {
  const body = await request.json() as {
    orgId?: string;
    name?: string;
    discipline?: string;
  };

  const { name, discipline } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Takım adı zorunludur" }, { status: 400 });
  }

  // Kullanıcıyı cookie'den doğrula
  const supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum açılmamış" }, { status: 401 });
  }

  // Service role ile membership'ten org_id bul — client'a güvenme
  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: membership } = await admin
    .from("memberships")
    .select("org_id, role")
    .eq("user_id", user.id)
    .single();

  if (!membership || !["admin", "coach"].includes(membership.role)) {
    return NextResponse.json({ error: "Yetkisiz işlem" }, { status: 403 });
  }

  const { data: team, error } = await admin
    .from("teams")
    .insert({
      org_id: membership.org_id,
      name: name.trim(),
      discipline: discipline?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ team });
}
