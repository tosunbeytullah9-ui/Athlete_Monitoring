import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getTeams } from "@athleteiq/db/queries/teams";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
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

  const [teams, orgResult] = await Promise.all([
    getTeams(supabase, orgId),
    supabase
      .from("organizations")
      .select("id, name, slug, plan, logo_url")
      .eq("id", orgId)
      .single(),
  ]);

  return (
    <SettingsClient
      orgId={orgId}
      org={orgResult.data}
      teams={teams}
    />
  );
}
