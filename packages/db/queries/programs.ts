import type { DbClient } from "./_client";
import type { TablesInsert, TablesUpdate } from "../types";

export async function getPrograms(client: DbClient, orgId: string) {
  const { data, error } = await client
    .from("training_programs")
    .select(
      `*, training_sessions(*, exercises(*, exercise_sets(*)))`
    )
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getProgramById(client: DbClient, id: string) {
  const { data, error } = await client
    .from("training_programs")
    .select(`*, training_sessions(*, exercises(*, exercise_sets(*)))`)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function createProgram(
  client: DbClient,
  program: TablesInsert<"training_programs">
) {
  const { data, error } = await client
    .from("training_programs")
    .insert(program)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function publishProgram(client: DbClient, id: string) {
  const { data, error } = await client
    .from("training_programs")
    .update({ is_published: true, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProgram(
  client: DbClient,
  id: string,
  updates: TablesUpdate<"training_programs">
) {
  const { data, error } = await client
    .from("training_programs")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
