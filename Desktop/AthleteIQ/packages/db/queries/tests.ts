import type { DbClient } from "./_client";
import type { TablesInsert } from "../types";

export async function getTestResults(
  client: DbClient,
  athleteId: string,
  testType?: string
) {
  let query = client
    .from("test_results")
    .select("*")
    .eq("athlete_id", athleteId)
    .order("test_date", { ascending: false });

  if (testType) query = query.eq("test_type", testType);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function addTestResult(
  client: DbClient,
  result: TablesInsert<"test_results">
) {
  const { data, error } = await client
    .from("test_results")
    .insert(result)
    .select()
    .single();

  if (error) throw error;
  return data;
}
