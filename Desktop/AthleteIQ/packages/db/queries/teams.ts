import type { DbClient } from "./_client";
import type { TablesInsert } from "../types";

export async function getTeams(client: DbClient, orgId: string) {
  const { data, error } = await client
    .from("teams")
    .select("*")
    .eq("org_id", orgId)
    .order("name");

  if (error) throw error;
  return data;
}

export async function getTeamById(client: DbClient, id: string) {
  const { data, error } = await client
    .from("teams")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function createTeam(client: DbClient, team: TablesInsert<"teams">) {
  const { data, error } = await client
    .from("teams")
    .insert(team)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTeam(client: DbClient, id: string) {
  const { error } = await client.from("teams").delete().eq("id", id);
  if (error) throw error;
}
