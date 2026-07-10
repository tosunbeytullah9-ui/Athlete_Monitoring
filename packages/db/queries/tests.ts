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

export interface TestFilters {
  athleteId?: string;
  category?: string; // not stored on row; UI-side filter, but accepts test_type list
  from?: string;
  to?: string;
}

// Org genelinde test sonuçları — test_results'ta org_id yok, athletes üzerinden bağlanır.
// athletes!inner ile RLS zaten org/team izolasyonunu sağlıyor.
export async function getTests(
  client: DbClient,
  orgId: string,
  filters: TestFilters = {}
) {
  let query = client
    .from("test_results")
    .select(
      "*, athletes!inner(id, full_name, org_id)"
    )
    .eq("athletes.org_id", orgId)
    .order("test_date", { ascending: false });

  if (filters.athleteId) query = query.eq("athlete_id", filters.athleteId);
  if (filters.from) query = query.gte("test_date", filters.from);
  if (filters.to) query = query.lte("test_date", filters.to);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createTest(
  client: DbClient,
  data: TablesInsert<"test_results">
) {
  const { data: row, error } = await client
    .from("test_results")
    .insert(data)
    .select("*, athletes!inner(id, full_name, org_id)")
    .single();

  if (error) throw error;
  return row;
}

export async function deleteTest(client: DbClient, id: string) {
  const { error } = await client.from("test_results").delete().eq("id", id);
  if (error) throw error;
}
