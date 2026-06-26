import { createClient } from "@/lib/supabase/server";
import { getAthletes } from "@athleteiq/db/queries/athletes";
import { AthletesClient } from "./athletes-client";
import type { Tables } from "@athleteiq/db/types";

type Membership = Pick<Tables<"memberships">, "org_id">;

export default async function AthletesPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Oturum bulunamadı.</p>
      </div>
    );
  }

  const membershipResult = await supabase
    .from("memberships")
    .select("org_id")
    .eq("user_id", user.id)
    .single();

  const membership = membershipResult.data as Membership | null;

  if (!membership?.org_id) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Organizasyon bulunamadı.</p>
      </div>
    );
  }

  const { data: teams } = await supabase
    .from("teams")
    .select("id, name")
    .eq("org_id", membership.org_id);

  const athletes = await getAthletes(supabase, membership.org_id);

  return <AthletesClient athletes={athletes} teams={teams ?? []} orgId={membership.org_id} />;
}
