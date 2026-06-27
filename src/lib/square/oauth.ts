import { SQUARE_OAUTH_SCOPES } from "@/lib/square/constants";
import {
  getSquareApplicationId,
  getSquareApplicationSecret,
  getSquareConnectBaseUrl,
  getSquareEnv,
  getSquareRedirectUri,
} from "@/lib/square/config";
import type { SquareOAuthTokenResponse } from "@/types/square";

export function buildSquareAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: getSquareApplicationId(),
    scope: SQUARE_OAUTH_SCOPES.join(" "),
    response_type: "code",
    redirect_uri: getSquareRedirectUri(),
    state,
  });

  if (getSquareEnv() === "production") {
    params.set("session", "false");
  }

  return `${getSquareConnectBaseUrl()}/oauth2/authorize?${params.toString()}`;
}

export async function exchangeSquareAuthorizationCode(
  code: string,
): Promise<SquareOAuthTokenResponse> {
  const response = await fetch(
    `${getSquareConnectBaseUrl()}/oauth2/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: getSquareApplicationId(),
        client_secret: getSquareApplicationSecret(),
        code,
        grant_type: "authorization_code",
        redirect_uri: getSquareRedirectUri(),
      }),
    },
  );

  const data = (await response.json()) as SquareOAuthTokenResponse;

  if (!response.ok) {
    throw new Error(
      data.errors?.[0]?.detail ??
        data.errors?.[0]?.code ??
        "Square token exchange failed.",
    );
  }

  return data;
}
