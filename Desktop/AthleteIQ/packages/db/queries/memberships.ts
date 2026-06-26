import type { DbClient } from "./_client";
import type { TablesInsert } from "../types";

export async function getMembership(client: DbClient, userId: string, orgId: string) {
  const { data, error } = await client
    .from("memberships")
    .select("*")
    .eq("user_id", userId)
    .eq("org_id", orgId)
    .single();

  if (error) throw error;
  return data;
}

export async function getMembershipsByOrg(client: DbClient, orgId: string) {
  const { data, error } = await client
    .from("memberships")
    .select("*, teams(name)")
    .eq("org_id", orgId)
    .order("joined_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createMembership(
  client: DbClient,
  membership: TablesInsert<"memberships">
) {
  const { data, error } = await client
    .from("memberships")
    .insert(membership)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteMembership(client: DbClient, id: string) {
  const { error } = await client.from("memberships").delete().eq("id", id);
  if (error) throw error;
}
