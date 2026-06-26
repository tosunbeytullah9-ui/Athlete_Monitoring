import type { PolarNightlyRecharge, PolarSleepResult } from "./types";
import type { DailyMetrics } from "../whoop/normalize";

export function normalizePolarMetrics(
  athleteId: string,
  recharge: PolarNightlyRecharge,
  sleep: PolarSleepResult | null
): DailyMetrics {
  // Polar ANS charge (0-4 skala) → 0-100 normalize
  const recoveryScore = recharge.ans_charge * 25;

  const totalSleepMin = sleep
    ? Math.round(
        (sleep.light_sleep + sleep.deep_sleep + sleep.rem_sleep) / 60
      )
    : null;

  const deepSleepMin = sleep ? Math.round(sleep.deep_sleep / 60) : null;
  const remSleepMin = sleep ? Math.round(sleep.rem_sleep / 60) : null;

  return {
    athleteId,
    provider: "polar",
    metricDate: recharge.date,
    recoveryScore,
    hrvRmssd: recharge.hrv_avg_ms ?? null,
    restingHr: recharge.heart_rate_avg,
    spo2: null,
    sleepScore: sleep?.sleep_score ?? null,
    totalSleepMin,
    deepSleepMin,
    remSleepMin,
    sleepEfficiency: null,
    strainScore: null,
    muscleLoad: null,
    activeCalories: null,
  };
}
