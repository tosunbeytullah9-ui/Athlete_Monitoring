import { z } from "zod";

export const WHOOPTokensSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_in: z.number(),
  token_type: z.string(),
});

export const WHOOPRecoverySchema = z.object({
  cycle_id: z.number(),
  sleep_id: z.number(),
  user_id: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
  score_state: z.string(),
  score: z
    .object({
      user_calibrating: z.boolean(),
      recovery_score: z.number(),
      resting_heart_rate: z.number(),
      hrv_rmssd_milli: z.number(),
      spo2_percentage: z.number().optional(),
      skin_temp_celsius: z.number().optional(),
    })
    .nullable(),
});

export const WHOOPSleepSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
  start: z.string(),
  end: z.string(),
  timezone_offset: z.string(),
  nap: z.boolean(),
  score_state: z.string(),
  score: z
    .object({
      stage_summary: z.object({
        total_in_bed_time_milli: z.number(),
        total_awake_time_milli: z.number(),
        total_no_data_time_milli: z.number(),
        total_light_sleep_time_milli: z.number(),
        total_slow_wave_sleep_time_milli: z.number(),
        total_rem_sleep_time_milli: z.number(),
        sleep_cycle_count: z.number(),
        disturbance_count: z.number(),
      }),
      sleep_needed: z.object({
        baseline_milli: z.number(),
        need_from_sleep_debt_milli: z.number(),
        need_from_recent_strain_milli: z.number(),
        need_from_recent_nap_milli: z.number(),
      }),
      respiratory_rate: z.number().optional(),
      sleep_performance_percentage: z.number().optional(),
      sleep_consistency_percentage: z.number().optional(),
      sleep_efficiency_percentage: z.number().optional(),
    })
    .nullable(),
});

export const WHOOPCycleSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
  start: z.string(),
  end: z.string().nullable(),
  timezone_offset: z.string(),
  score_state: z.string(),
  score: z
    .object({
      strain: z.number(),
      kilojoule: z.number(),
      average_heart_rate: z.number(),
      max_heart_rate: z.number(),
    })
    .nullable(),
});

export type WHOOPTokens = z.infer<typeof WHOOPTokensSchema>;
export type WHOOPRecovery = z.infer<typeof WHOOPRecoverySchema>;
export type WHOOPSleep = z.infer<typeof WHOOPSleepSchema>;
export type WHOOPCycle = z.infer<typeof WHOOPCycleSchema>;
