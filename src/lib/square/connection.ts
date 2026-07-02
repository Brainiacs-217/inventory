import { revalidatePath } from "next/cache";

import { squareSandboxFetch } from "@/lib/square/client";
import {
  getSquareAccessToken,
  isSquareSandboxTokenConfigured,
} from "@/lib/square/config";
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
  return {
    organization_id: organizationId,
    merchant_id: connection.merchantId,
    access_token: connection.accessToken,
    refresh_token: connection.refreshToken,
    expires_at: connection.expiresAt,
  };
}

function mapRowToConnection(row: Tables<"square_connections">): SquareConnection {
  return {
    merchantId: row.merchant_id,
    accessToken: row.access_token,
    refreshToken: row.refresh_token,
    expiresAt: row.expires_at,
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

  return { ...mapRowToConnection(data), source: "database" };
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
): Promise<SaveResult> {
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

  return saveSquareConnection(organizationId, {
    merchantId,
    accessToken: getSquareAccessToken(),
    refreshToken: "",
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  });
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
