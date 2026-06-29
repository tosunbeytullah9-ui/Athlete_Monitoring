import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  const body = await request.json() as {
    orgId?: string;
    teamName?: string;
    discipline?: string;
    accessToken?: string;
  };

  const { orgId, teamName, discipline, accessToken } = body;

  if (!orgId || !teamName?.trim()) {
    return NextResponse.json({ error: "Eksik alanlar" }, { status: 400 });
  }

  if (!accessToken) {
    return NextResponse.json({ error: "Oturum bilgisi eksik" }, { status: 401 });
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // Access token ile kullanıcıyı doğrula
  const { data: { user }, error: userError } = await admin.auth.getUser(accessToken);

  if (userError || !user) {
    return NextResponse.json({ error: "Geçersiz oturum" }, { status: 401 });
  }

  const { error } = await admin.from("teams").insert({
    org_id: orgId,
    name: teamName.trim(),
    discipline: discipline?.trim() || null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
