import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { NewProgramClient } from "./new-program-client";
import { getPlatformExercises, getOrgExercises, getOrgCategories } from "@athleteiq/db/queries/exercises";

export default async function NewProgramPage() {
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

  const [teamsResult, athletesResult, platformExercises, orgExercises, categories] = await Promise.all([
    supabase.from("teams").select("id, name").eq("org_id", orgId).order("name"),
    supabase
      .from("athletes")
      .select("id, full_name, team_id")
      .eq("org_id", orgId)
      .eq("is_active", true)
      .order("full_name"),
    getPlatformExercises(supabase),
    getOrgExercises(supabase, orgId),
    getOrgCategories(supabase, orgId),
  ]);

  return (
    <NewProgramClient
      orgId={orgId}
      teams={teamsResult.data ?? []}
      athletes={athletesResult.data ?? []}
      platformExercises={platformExercises}
      orgExercises={orgExercises}
      categories={categories}
    />
  );
}
