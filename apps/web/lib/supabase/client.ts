"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@athleteiq/db/types";

// @supabase/ssr@0.5.2'nin peer dependency'si @supabase/supabase-js
// ^2.43.4 bekliyor ama yüklü sürüm 2.108.2 — iki sürüm arasında
// SupabaseClient generic imzası (3 generic → 5 generic) değişmiş,
// createBrowserClient/createServerClient hâlâ eski imzayla çağırıyor.
// Bu assertion SADECE bu tip uyuşmazlığını düzeltir, runtime davranışı
// değiştirmez. @supabase/ssr ileride uyumlu bir sürüme yükseltilirse
// (peer dep aralığı gerçekten hizalanınca) bu assertion kaldırılabilir
// — bkz. BUGS.md.
export function createClient() {
  return createBrowserClient<Database, "public">(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ) as unknown as SupabaseClient<Database, "public">;
}
