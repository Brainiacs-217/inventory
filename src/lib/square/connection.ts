import { revalidatePath } from "next/cache";

import { getSql } from "@/lib/sql/client";
import { squareSandboxFetch } from "@/lib/square/client";
import {
  getSquareAccessToken,
  getSquareApplicationSecret,
  isSquareSandboxTokenConfigured,
} from "@/lib/square/config";
import { decryptSquareToken, encryptSquareToken } from "@/lib/square/tokenCrypto";
import { MAX_ORGANIZATION_NAME_LENGTH } from "@/lib/square/constants";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { SquareConnection } from "@/types/square";
import type { Tables, TablesInsert } from "@/types/database";

type SaveResult = { error: string } | { connectionId: string };

export type ResolvedSquareConnection = SquareConnection & {
  source: "database";
};

function mapTokenResponseToConnection(tokens: {
  access_token: string;
  refresh_token: string;
  merchant_id: string;
  expires_at: string;
}): SquareConnection {
  return {
    merchantId: tokens.merchant_id,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: tokens.expires_at,
  };
}

function mapConnectionToInsert(
  organizationId: string,
  connection: SquareConnection,
): TablesInsert<"square_connections"> {
  const secret = getSquareApplicationSecret();
  return {
    organization_id: organizationId,
    square_merchant_id: connection.merchantId,
    access_token_encrypted: encryptSquareToken(connection.accessToken, secret),
    refresh_token_encrypted: connection.refreshToken
      ? encryptSquareToken(connection.refreshToken, secret)
      : null,
    expires_at: connection.expiresAt,
  };
}

function mapRowToConnection(row: Tables<"square_connections">): SquareConnection {
  if (!row.access_token_encrypted) {
    throw new Error("Square connection is missing an access token.");
  }

  const secret = getSquareApplicationSecret();
  return {
    merchantId: row.square_merchant_id,
    accessToken: decryptSquareToken(row.access_token_encrypted, secret),
    refreshToken: row.refresh_token_encrypted
      ? decryptSquareToken(row.refresh_token_encrypted, secret)
      : "",
    expiresAt: row.expires_at ?? "",
  };
}

/** Linked Square connection for an org (database only — use Connect to link sandbox token). */
export async function getSquareConnection(
  organizationId: string,
): Promise<ResolvedSquareConnection | null> {
  if (!organizationId || !isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("square_connections")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error || !data) return null;

  try {
    return { ...mapRowToConnection(data), source: "database" };
  } catch {
    return null;
  }
}

/** Access token for Square API calls: org connection first, then sandbox env token. */
export async function resolveSquareAccessToken(
  organizationId: string | null,
): Promise<string | null> {
  if (organizationId) {
    const connection = await getSquareConnection(organizationId);
    if (connection?.accessToken) return connection.accessToken;
  }

  if (isSquareSandboxTokenConfigured()) {
    return getSquareAccessToken();
  }

  return null;
}

async function saveSquareConnection(
  organizationId: string,
  connection: SquareConnection,
): Promise<SaveResult> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured." };
  }

  if (!organizationId) {
    return { error: "Select an organization before connecting Square." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to connect Square." };
  }

  const { data, error } = await supabase
    .from("square_connections")
    .upsert(mapConnectionToInsert(organizationId, connection), {
      onConflict: "organization_id",
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { connectionId: data.id };
}

/** Link the sandbox access token from .env.local to the current organization. */
export async function connectSandboxFromEnv(
  organizationId: string,
): Promise<{ error: string } | { connectionId: string; merchantId: string }> {
  if (!isSquareSandboxTokenConfigured()) {
    return { error: "SQUARE_ACCESS_TOKEN is not configured in .env.local." };
  }

  let merchantId = process.env.SQUARE_MERCHANT_ID?.trim() ?? "sandbox";

  try {
    const profile = await squareSandboxFetch<{ merchant?: { id?: string } }>(
      "/v2/merchants/me",
    );
    if (profile.merchant?.id) {
      merchantId = profile.merchant.id;
    }
  } catch {
    // Keep default merchant id if the profile request fails.
  }

  const saved = await saveSquareConnection(organizationId, {
    merchantId,
    accessToken: getSquareAccessToken(),
    refreshToken: "",
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  });

  if ("error" in saved) return saved;
  return { connectionId: saved.connectionId, merchantId };
}

export async function saveSquareConnectionFromOAuth(
  organizationId: string,
  tokens: {
    access_token: string;
    refresh_token: string;
    merchant_id: string;
    expires_at: string;
  },
): Promise<SaveResult> {
  const connection = mapTokenResponseToConnection(tokens);
  return saveSquareConnection(organizationId, connection);
}

/**
 * Creates the organization only after Square has already returned an access token.
 * The organization, membership, and connection commit together.
 */
export async function createOrganizationWithSquareConnection(
  userId: string,
  name: string,
  connection: SquareConnection,
): Promise<{ error: string } | { organizationId: string; merchantId: string }> {
  const trimmedName = name.trim();
  if (!userId) {
    return { error: "You must be signed in to create an organization." };
  }
  if (!trimmedName || trimmedName.length > MAX_ORGANIZATION_NAME_LENGTH) {
    return { error: "Enter an organization name before connecting Square." };
  }
  if (!connection.accessToken || !connection.merchantId) {
    return { error: "Square did not return an access token." };
  }

  const secret = getSquareApplicationSecret();
  const accessTokenEncrypted = encryptSquareToken(connection.accessToken, secret);
  const refreshTokenEncrypted = connection.refreshToken
    ? encryptSquareToken(connection.refreshToken, secret)
    : null;

  try {
    const organizationId = await getSql().begin(async (tx) => {
      const inserted = await tx<{ id: string }[]>`
        insert into public.organizations (name, created_by)
        values (${trimmedName}, ${userId})
        returning id
      `;
      const id = inserted[0]?.id;
      if (!id) {
        throw new Error("Organization was not created.");
      }

      await tx`
        insert into public.organization_members (organization_id, profile_id, role)
        values (${id}, ${userId}, 'owner')
      `;
      await tx`
        insert into public.square_connections (
          organization_id,
          square_merchant_id,
          access_token_encrypted,
          refresh_token_encrypted,
          expires_at
        )
        values (
          ${id},
          ${connection.merchantId},
          ${accessTokenEncrypted},
          ${refreshTokenEncrypted},
          ${connection.expiresAt}
        )
      `;
      return id;
    });

    revalidatePath("/dashboard");
    return { organizationId, merchantId: connection.merchantId };
  } catch (error) {
    const code =
      typeof error === "object" && error && "code" in error
        ? String(error.code)
        : "";
    if (code === "23505") {
      return {
        error: "That Square account is already connected to an organization.",
      };
    }
    console.error("Failed to create organization with Square connection", error);
    return { error: "Could not save the Square connection." };
  }
}

export async function disconnectSquareConnection(
  organizationId: string,
): Promise<{ error: string } | Record<string, never>> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured." };
  }

  if (!organizationId) {
    return { error: "Select an organization before disconnecting Square." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to disconnect Square." };
  }

  const { error } = await supabase
    .from("square_connections")
    .delete()
    .eq("organization_id", organizationId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return {};
}
