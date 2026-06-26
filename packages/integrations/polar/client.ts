import type { PolarNightlyRecharge, PolarSleepResult } from "./types";
import { PolarNightlyRechargeSchema, PolarSleepResultSchema } from "./types";
import { z } from "zod";

const BASE_URL = "https://www.polaraccesslink.com/v4";

export class PolarClient {
  private async request<T>(
    accessToken: string,
    path: string,
    params?: Record<string, string>
  ): Promise<T> {
    const url = new URL(`${BASE_URL}${path}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Polar API error ${res.status}: ${path}`);
    }

    return res.json() as Promise<T>;
  }

  async getNightlyRechargeResults(
    accessToken: string,
    params: { from: string; to: string }
  ): Promise<PolarNightlyRecharge[]> {
    const data = await this.request<{ nightly_recharge_results: unknown[] }>(
      accessToken,
      "/data/nightly-recharge-results",
      params
    );
    return z.array(PolarNightlyRechargeSchema).parse(
      data["nightly_recharge_results"] ?? []
    );
  }

  async getSleepResults(
    accessToken: string,
    params: { from: string; to: string }
  ): Promise<PolarSleepResult[]> {
    const data = await this.request<{ sleep_results: unknown[] }>(
      accessToken,
      "/data/sleep-results",
      params
    );
    return z.array(PolarSleepResultSchema).parse(data["sleep_results"] ?? []);
  }
}
