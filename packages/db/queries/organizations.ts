import type { DbClient } from "./_client";
import type { TablesInsert } from "../types";

export async function createOrganization(
  client: DbClient,
  org: TablesInsert<"organizations">
) {
  const { data, error } = await client
    .from("organizations")
    .insert(org)
    .select("id, name, slug")
    .single();

  if (error) throw error;
  return data;
}
