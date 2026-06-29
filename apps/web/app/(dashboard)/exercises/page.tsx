import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
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

  // Service role ile membership bul — cookie bağımsız
  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: membership } = await admin
    .from("memberships")
    .select("org_id, role")
    .eq("user_id", user.id)
    .single();

  if (!membership?.org_id) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Organizasyon bulunamadı.</p>
      </div>
    );
  }

  // platform_exercises herkese açık, org verileri service role ile çek
  const [platformExercises, orgExercises, categories] = await Promise.all([
    getPlatformExercises(supabase),
    admin.from("org_exercises").select("*").eq("org_id", membership.org_id).order("name"),
    admin.from("org_exercise_categories").select("*").eq("org_id", membership.org_id).order("name"),
  ]);

  return (
    <ExercisesClient
      platformExercises={platformExercises}
      orgExercises={(orgExercises.data ?? []) as Parameters<typeof ExercisesClient>[0]["orgExercises"]}
      categories={(categories.data ?? []) as Parameters<typeof ExercisesClient>[0]["categories"]}
      orgId={membership.org_id}
      userId={user.id}
      userRole={membership.role}
    />
  );
}
