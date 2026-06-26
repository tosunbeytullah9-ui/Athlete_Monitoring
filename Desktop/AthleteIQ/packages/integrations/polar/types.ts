import { z } from "zod";

export const PolarTokensSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  x_user_id: z.number(),
});

export const PolarNightlyRechargeSchema = z.object({
  polar_user: z.string(),
  date: z.string(),
  heart_rate_avg: z.number(),
  breathing_rate_avg: z.number(),
  hrv_avg_ms: z.number().optional(),
  nightly_recharge_status: z.number(),
  ans_charge: z.number(),
  ans_charge_status: z.string(),
  sleep_charge: z.number().optional(),
  sleep_charge_status: z.string().optional(),
});

export const PolarSleepResultSchema = z.object({
  polar_user: z.string(),
  date: z.string(),
  sleep_start_time: z.string(),
  sleep_end_time: z.string(),
  device_id: z.string(),
  continuity: z.number(),
  continuity_class: z.number(),
  light_sleep: z.number(),
  deep_sleep: z.number(),
  rem_sleep: z.number(),
  unrecognized_sleep_stage: z.number(),
  sleep_score: z.number(),
  total_interruption_duration: z.number(),
  interruptions: z.number(),
  long_interruption_duration: z.number(),
  long_interruptions: z.number(),
  sleep_cycles: z.number(),
  group_duration_score: z.number(),
  group_solidity_score: z.number(),
  group_regenerative_quality_score: z.number(),
  short_interruption_duration: z.number(),
  short_interruptions: z.number(),
  hypnogram_5min: z.string(),
  skin_temperature: z.number().optional(),
});

export const PolarExerciseSchema = z.object({
  id: z.string(),
  upload_time: z.string(),
  polar_user: z.string(),
  device: z.string(),
  start_time: z.string(),
  start_time_utc_offset: z.number(),
  duration: z.string(),
  calories: z.number(),
  distance: z.number().optional(),
  heart_rate: z
    .object({
      average: z.number(),
      maximum: z.number(),
    })
    .optional(),
  training_load: z.number().optional(),
  sport: z.string(),
  has_route: z.boolean(),
  detailed_sport_info: z.string().optional(),
});

export type PolarTokens = z.infer<typeof PolarTokensSchema>;
export type PolarNightlyRecharge = z.infer<typeof PolarNightlyRechargeSchema>;
export type PolarSleepResult = z.infer<typeof PolarSleepResultSchema>;
export type PolarExercise = z.infer<typeof PolarExerciseSchema>;
