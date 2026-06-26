"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@athleteiq/db/types";

export function createClient() {
  return createBrowserClient<Database, "public">(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
