import type { WHOOPRecovery, WHOOPSleep, WHOOPCycle, WHOOPTokens } from "./types";
import { refreshToken } from "./oauth";

const BASE_URL = "https://api.prod.whoop.com/developer/v2";

interface TokenStore {
  getToken(athleteId: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
  }>;
  saveTokens(athleteId: string, tokens: WHOOPTokens): Promise<void>;
}

export class WHOOPClient {
  constructor(
    private readonly tokenStore: TokenStore,
    private readonly clientId: string,
    private readonly clientSecret: string
  ) {}

  private async getValidToken(athleteId: string): Promise<string> {
    const stored = await this.tokenStore.getToken(athleteId);

    // 5 dakika erken yenile
    const expiresAt = new Date(stored.expiresAt);
    const refreshThreshold = new Date(Date.now() + 5 * 60 * 1000);

    if (expiresAt < refreshThreshold) {
      const newTokens = await refreshToken(
        stored.refreshToken,
        this.clientId,
        this.clientSecret
      );
      await this.tokenStore.saveTokens(athleteId, newTokens);
      return newTokens.access_token;
    }

    return stored.accessToken;
  }

  private async request<T>(
    athleteId: string,
    path: string,
    params?: Record<string, string>
  ): Promise<T> {
    const token = await this.getValidToken(athleteId);
    const url = new URL(`${BASE_URL}${path}`);

    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new Error(`WHOOP API error ${res.status}: ${path}`);
    }

    return res.json() as Promise<T>;
  }

  async getRecoveryList(
    athleteId: string,
    params: { start: string; end: string; nextToken?: string }
  ) {
    return this.request<{ records: WHOOPRecovery[]; next_token?: string }>(
      athleteId,
      "/cycle",
      {
        start: params.start,
        end: params.end,
        ...(params.nextToken ? { nextToken: params.nextToken } : {}),
      }
    );
  }

  async getSleepList(
    athleteId: string,
    params: { start: string; end: string }
  ) {
    return this.request<{ records: WHOOPSleep[]; next_token?: string }>(
      athleteId,
      "/activity/sleep",
      params
    );
  }

  async getCycleList(
    athleteId: string,
    params: { start: string; end: string }
  ) {
    return this.request<{ records: WHOOPCycle[]; next_token?: string }>(
      athleteId,
      "/cycle",
      params
    );
  }

  async getProfile(athleteId: string) {
    return this.request<{ user_id: number; email: string; first_name: string; last_name: string }>(
      athleteId,
      "/user/profile/basic"
    );
  }
}
