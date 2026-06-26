import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAthleteById } from "@athleteiq/db/queries/athletes";
import { AthleteDetailClient } from "./athlete-detail-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AthleteDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const [athlete, programsResult, testsResult, acwrResult] = await Promise.all([
    getAthleteById(supabase, id).catch(() => null),
    supabase
      .from("training_programs")
      .select("id, title, phase, start_date, end_date, is_published, week_number")
      .eq("athlete_id", id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("test_results")
      .select("*")
      .eq("athlete_id", id)
      .order("test_date", { ascending: false })
      .limit(10),
    supabase
      .from("acwr_logs")
      .select("log_date, session_load, acwr_ratio, acute_load, chronic_load")
      .eq("athlete_id", id)
      .order("log_date", { ascending: false })
      .limit(30),
  ]);

  if (!athlete) notFound();

  return (
    <AthleteDetailClient
      athlete={athlete}
      recentPrograms={programsResult.data ?? []}
      recentTests={testsResult.data ?? []}
      acwrLogs={acwrResult.data ?? []}
    />
  );
}
