import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@athleteiq/db/types";

// @supabase/ssr@0.5.2'nin peer dependency'si @supabase/supabase-js
// ^2.43.4 bekliyor ama yüklü sürüm 2.108.2 — iki sürüm arasında
// SupabaseClient generic imzası (3 generic → 5 generic) değişmiş,
// createBrowserClient/createServerClient hâlâ eski imzayla çağırıyor.
// Bu assertion SADECE bu tip uyuşmazlığını düzeltir, runtime davranışı
// değiştirmez. @supabase/ssr ileride uyumlu bir sürüme yükseltilirse
// (peer dep aralığı gerçekten hizalanınca) bu assertion kaldırılabilir
// — bkz. BUGS.md.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database, "public">(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component içinden çağrıldığında ignore edilir
          }
        },
      },
    }
  ) as unknown as SupabaseClient<Database, "public">;
}

export async function createServiceClient() {
  const cookieStore = await cookies();

  return createServerClient<Database, "public">(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  ) as unknown as SupabaseClient<Database, "public">;
}
