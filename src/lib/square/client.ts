import {
  getSquareAccessToken,
  getSquareApiBaseUrl,
  getSquareApplicationId,
  getSquareApplicationSecret,
  isSquareSandboxTokenConfigured,
} from "@/lib/square/config";
import type { SquareOAuthTokenResponse } from "@/types/square";

type SquareApiErrorBody = {
  errors?: Array<{ detail?: string; code?: string }>;
};

export class SquareApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SquareApiError";
  }
}

export async function squareFetch<T>(
  accessToken: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${getSquareApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Square-Version": "2025-04-16",
      ...init?.headers,
    },
  });

  const data = (await response.json()) as T & SquareApiErrorBody;

  if (!response.ok) {
    throw new SquareApiError(
      data.errors?.[0]?.detail ??
        data.errors?.[0]?.code ??
        `Square API request failed (${response.status}).`,
    );
  }

  return data;
}

/** Call Square API using the sandbox access token from env (server-only). */
export async function squareSandboxFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  if (!isSquareSandboxTokenConfigured()) {
    throw new SquareApiError("SQUARE_ACCESS_TOKEN is not configured.");
  }

  return squareFetch<T>(getSquareAccessToken(), path, init);
}

export async function refreshSquareAccessToken(
  refreshToken: string,
): Promise<SquareOAuthTokenResponse> {
  const response = await fetch(`${getSquareApiBaseUrl()}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: getSquareApplicationId(),
      client_secret: getSquareApplicationSecret(),
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  const data = (await response.json()) as SquareOAuthTokenResponse;

  if (!response.ok) {
    throw new SquareApiError(
      data.errors?.[0]?.detail ??
        data.errors?.[0]?.code ??
        "Square token refresh failed.",
    );
  }

  return data;
}
