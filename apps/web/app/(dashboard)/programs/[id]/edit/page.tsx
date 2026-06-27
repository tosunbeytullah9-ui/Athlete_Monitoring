import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getProgramById } from "@athleteiq/db/queries/programs";
import { getPlatformExercises, getOrgExercises, getOrgCategories } from "@athleteiq/db/queries/exercises";
import { EditProgramClient } from "./edit-program-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProgramPage({ params }: Props) {
  const { id } = await params;
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

  const [program, teamsResult, athletesResult, platformExercises, orgExercises, categories] =
    await Promise.all([
      getProgramById(supabase, id).catch(() => null),
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

  if (!program) notFound();

  return (
    <EditProgramClient
      program={program}
      orgId={orgId}
      teams={teamsResult.data ?? []}
      athletes={athletesResult.data ?? []}
      platformExercises={platformExercises}
      orgExercises={orgExercises}
      categories={categories}
    />
  );
}
