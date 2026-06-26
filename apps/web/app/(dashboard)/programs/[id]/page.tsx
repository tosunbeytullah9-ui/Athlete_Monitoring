import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProgramById } from "@athleteiq/db/queries/programs";
import { ProgramDetailClient } from "./program-detail-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProgramDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const program = await getProgramById(supabase, id).catch(() => null);
  if (!program) notFound();

  const [athleteResult, teamResult] = await Promise.all([
    program.athlete_id
      ? supabase.from("athletes").select("id, full_name").eq("id", program.athlete_id).single()
      : Promise.resolve({ data: null }),
    program.team_id
      ? supabase.from("teams").select("id, name").eq("id", program.team_id).single()
      : Promise.resolve({ data: null }),
  ]);

  return (
    <ProgramDetailClient
      program={program}
      athlete={athleteResult.data ?? null}
      team={teamResult.data ?? null}
    />
  );
}
