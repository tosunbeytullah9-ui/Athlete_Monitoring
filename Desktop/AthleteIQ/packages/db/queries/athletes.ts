import type { DbClient } from "./_client";
import type { TablesInsert, TablesUpdate } from "../types";

export async function getAthletes(client: DbClient, orgId: string) {
  const { data, error } = await client
    .from("athletes")
    .select("*")
    .eq("org_id", orgId)
    .eq("is_active", true)
    .order("full_name");

  if (error) throw error;
  return data;
}

export async function getAthleteById(client: DbClient, id: string) {
  const { data, error } = await client
    .from("athletes")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function createAthlete(
  client: DbClient,
  athlete: TablesInsert<"athletes">
) {
  const { data, error } = await client
    .from("athletes")
    .insert(athlete)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateAthlete(
  client: DbClient,
  id: string,
  updates: TablesUpdate<"athletes">
) {
  const { data, error } = await client
    .from("athletes")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
