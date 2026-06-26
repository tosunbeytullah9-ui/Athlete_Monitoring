import type { DbClient } from "./_client";
import type { TablesInsert } from "../types";

export async function getAcwrLogs(
  client: DbClient,
  athleteId: string,
  from: string,
  to: string
) {
  const { data, error } = await client
    .from("acwr_logs")
    .select("*")
    .eq("athlete_id", athleteId)
    .gte("log_date", from)
    .lte("log_date", to)
    .order("log_date");

  if (error) throw error;
  return data;
}

export async function upsertAcwrLog(
  client: DbClient,
  log: TablesInsert<"acwr_logs">
) {
  const { data, error } = await client
    .from("acwr_logs")
    .upsert(log, { onConflict: "athlete_id,log_date" })
    .select()
    .single();

  if (error) throw error;
  return data;
}
