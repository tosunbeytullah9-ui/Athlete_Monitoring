import type { PolarTokens } from "./types";
import { PolarTokensSchema } from "./types";

const TOKEN_URL = "https://polarremote.com/v2/oauth2/token";

export function buildAuthUrl(
  clientId: string,
  redirectUri: string,
  state: string
): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "activity:read sleep:read nightly_recharge:read training_sessions:read continuous_samples:read",
    state,
  });
  return `https://flow.polar.com/oauth2/authorization?${params}`;
}

export async function exchangeCode(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<PolarTokens> {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!res.ok) {
    throw new Error(`Polar token exchange failed: ${res.status}`);
  }

  // Polar token'ları sona ermez — refresh token yoktur
  return PolarTokensSchema.parse(await res.json());
}

export async function registerUser(
  accessToken: string,
  memberId: string
): Promise<void> {
  const res = await fetch("https://www.polaraccesslink.com/v4/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ "member-id": memberId }),
  });

  // 409 = kullanıcı zaten kayıtlı — normal
  if (!res.ok && res.status !== 409) {
    throw new Error(`Polar user registration failed: ${res.status}`);
  }
}
