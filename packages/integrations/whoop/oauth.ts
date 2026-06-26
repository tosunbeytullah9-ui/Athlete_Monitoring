import type { WHOOPTokens } from "./types";
import { WHOOPTokensSchema } from "./types";

const TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token";

export function buildAuthUrl(
  clientId: string,
  redirectUri: string,
  state: string
): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope:
      "offline read:cycles read:sleep read:recovery read:workout read:body_measurement read:profile",
    state,
  });
  return `https://api.prod.whoop.com/oauth/oauth2/auth?${params}`;
}

export async function exchangeCode(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<WHOOPTokens> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    }),
  });

  if (!res.ok) {
    throw new Error(`WHOOP token exchange failed: ${res.status}`);
  }

  return WHOOPTokensSchema.parse(await res.json());
}

export async function refreshToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<WHOOPTokens> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) {
    throw new Error(`WHOOP token refresh failed: ${res.status}`);
  }

  // Dönen yeni refresh_token DB'ye kaydedilmeli — eski geçersiz
  return WHOOPTokensSchema.parse(await res.json());
}
