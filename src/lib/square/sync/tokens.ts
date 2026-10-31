import "server-only";

import { SquareApiError, refreshSquareAccessToken } from "@/lib/square/client";
import { getSquareApplicationSecret } from "@/lib/square/config";
import { decryptSquareToken, encryptSquareToken } from "@/lib/square/tokenCrypto";
import { getSql } from "@/lib/sql/client";

const TOKEN_REFRESH_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export type SquareConnectionRow = {
  organization_id: string;
  access_token_encrypted: string | null;
  refresh_token_encrypted: string | null;
  expires_at: Date | string | null;
  last_synced_at: Date | string | null;
};

export function readTimestamp(value: Date | string | null): Date | null {
  if (value == null) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function shouldRefreshToken(expiresAt: Date | null, refreshToken: string): boolean {
  if (!refreshToken) return false;
  if (!expiresAt) return true;
  return expiresAt.getTime() - Date.now() <= TOKEN_REFRESH_WINDOW_MS;
}

export async function listSyncConnections(): Promise<SquareConnectionRow[]> {
  return getSql()<SquareConnectionRow[]>`
    select
      organization_id,
      access_token_encrypted,
      refresh_token_encrypted,
      expires_at,
      last_synced_at
    from square_connections
    where access_token_encrypted is not null
  `;
}

export async function loadSyncConnection(
  organizationId: string,
): Promise<SquareConnectionRow | null> {
  const rows = await getSql()<SquareConnectionRow[]>`
    select
      organization_id,
      access_token_encrypted,
      refresh_token_encrypted,
      expires_at,
      last_synced_at
    from square_connections
    where organization_id = ${organizationId}
      and access_token_encrypted is not null
  `;
  return rows[0] ?? null;
}

/**
 * Decrypt the stored token. When a refresh token exists and expiry is within
 * 7 days, refresh it and write the new encrypted tokens back before catalog
 * or order calls.
 */
export async function accessTokenForSync(
  row: SquareConnectionRow,
): Promise<{ accessToken: string; refreshed: boolean }> {
  if (!row.access_token_encrypted) {
    throw new Error("Square connection is missing an access token.");
  }

  const secret = getSquareApplicationSecret();
  const accessToken = decryptSquareToken(row.access_token_encrypted, secret);
  const refreshToken = row.refresh_token_encrypted
    ? decryptSquareToken(row.refresh_token_encrypted, secret)
    : "";

  if (!shouldRefreshToken(readTimestamp(row.expires_at), refreshToken)) {
    return { accessToken, refreshed: false };
  }

  const refreshed = await refreshSquareAccessToken(refreshToken);
  if (!refreshed.access_token || !refreshed.expires_at) {
    throw new SquareApiError("Square token refresh did not return a new access token.");
  }

  const nextRefreshToken = refreshed.refresh_token?.trim() || refreshToken;
  await getSql()`
    update square_connections
    set
      access_token_encrypted = ${encryptSquareToken(refreshed.access_token, secret)},
      refresh_token_encrypted = ${encryptSquareToken(nextRefreshToken, secret)},
      expires_at = ${refreshed.expires_at}
    where organization_id = ${row.organization_id}
  `;

  return { accessToken: refreshed.access_token, refreshed: true };
}
