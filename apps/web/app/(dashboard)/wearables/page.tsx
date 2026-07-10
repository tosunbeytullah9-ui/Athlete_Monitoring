import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getWearableConnections } from "@athleteiq/db/queries/wearables";
import { WearablesClient } from "./wearables-client";

export default async function WearablesPage() {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const orgId = cookieStore.get("aiq_org_id")?.value;

  if (!orgId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Organizasyon bulunamadı.</p>
      </div>
    );
  }

  const [connections, athletesResult] = await Promise.all([
    getWearableConnections(supabase, orgId),
    supabase
      .from("athletes")
      .select("id, full_name")
      .eq("org_id", orgId)
      .eq("is_active", true)
      .order("full_name"),
  ]);

  return (
    <WearablesClient
      connections={connections}
      athletes={athletesResult.data ?? []}
    />
  );
}
