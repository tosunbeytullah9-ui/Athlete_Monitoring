import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Cron: her saat çalışır — Polar transaction'larını çeker
Deno.serve(async (_req: Request) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: connections, error } = await supabase
    .from("wearable_connections")
    .select("*, athletes(id)")
    .eq("provider", "polar")
    .eq("is_active", true);

  if (error) {
    console.error("Polar sync — connection fetch error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  // Integration Agent bu kısmı dolduracak (transaction fetch + normalize + commit)
  console.log(`Polar sync: ${connections?.length ?? 0} aktif bağlantı`);

  return new Response(
    JSON.stringify({ synced: connections?.length ?? 0 }),
    { headers: { "Content-Type": "application/json" } }
  );
});
