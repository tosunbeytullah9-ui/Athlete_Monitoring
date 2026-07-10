import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// Server-side logout: Supabase oturumunu kapatır VE aiq_* cookie'lerini siler.
// aiq_* cookie'leri httpOnly olduğu için client JS silemez — bu route zorunlu.
export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const cookieStore = await cookies();
  cookieStore.delete("aiq_uid");
  cookieStore.delete("aiq_role");
  cookieStore.delete("aiq_org_id");
  cookieStore.delete("aiq_team_id");

  // Redirect değil JSON döndür — hard navigation client'ta (header.tsx) yapılıyor.
  // Böylece fetch bir redirect zincirini takip etmez ve athlete guard devreye
  // girmez.
  return NextResponse.json({ success: true });
}
