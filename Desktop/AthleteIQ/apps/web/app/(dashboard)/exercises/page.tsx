import { createClient } from "@/lib/supabase/server";
import { getPlatformExercises, getOrgExercises, getOrgCategories } from "@athleteiq/db/queries/exercises";
import { ExercisesClient } from "./exercises-client";

export default async function ExercisesPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Oturum bulunamadı.</p>
      </div>
    );
  }

  const { data: membershipRaw } = await supabase
    .from("memberships")
    .select("org_id, role")
    .eq("user_id", user.id)
    .single();

  const membership = membershipRaw as { org_id: string; role: string } | null;

  if (!membership?.org_id) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Organizasyon bulunamadı.</p>
      </div>
    );
  }

  const [platformExercises, orgExercises, categories] = await Promise.all([
    getPlatformExercises(supabase),
    getOrgExercises(supabase, membership.org_id),
    getOrgCategories(supabase, membership.org_id),
  ]);

  return (
    <ExercisesClient
      platformExercises={platformExercises}
      orgExercises={orgExercises}
      categories={categories}
      orgId={membership.org_id}
      userId={user.id}
      userRole={membership.role}
    />
  );
}
