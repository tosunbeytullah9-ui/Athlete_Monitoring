import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import type { Database } from "@athleteiq/db/types";

export async function POST(request: NextRequest) {
  const body = await request.json() as {
    orgName?: string;
    slug?: string;
    sport?: string;
    country?: string;
    accessToken?: string;
  };

  const { orgName, slug, sport, accessToken } = body;

  if (!orgName?.trim() || !slug?.trim() || !sport) {
    return NextResponse.json({ error: "Eksik alanlar" }, { status: 400 });
  }

  if (!accessToken) {
    return NextResponse.json({ error: "Oturum bilgisi eksik" }, { status: 401 });
  }

  const admin = createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // Access token ile kullanıcıyı doğrula
  const { data: { user }, error: userError } = await admin.auth.getUser(accessToken);

  if (userError || !user) {
    return NextResponse.json({ error: "Geçersiz oturum" }, { status: 401 });
  }

  // Org oluştur
  const { data: org, error: orgError } = await admin
    .from("organizations")
    .insert({
      name: orgName.trim(),
      slug: slug.trim(),
      plan: "free",
      plan_status: "trial",
      owner_id: user.id,
    })
    .select("id")
    .single();

  if (orgError || !org) {
    if (orgError?.code === "23505") {
      return NextResponse.json({ error: "Bu slug zaten kullanımda. Farklı bir slug deneyin." }, { status: 409 });
    }
    return NextResponse.json({ error: orgError?.message ?? "Org oluşturulamadı" }, { status: 500 });
  }

  // Membership oluştur (admin rolü)
  const { error: memberError } = await admin
    .from("memberships")
    .insert({
      user_id: user.id,
      org_id: org.id,
      role: "admin",
    });

  if (memberError) {
    await admin.from("organizations").delete().eq("id", org.id);
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  return NextResponse.json({ orgId: org.id });
}
