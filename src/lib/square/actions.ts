"use server";

import { squareSandboxFetch } from "@/lib/square/client";
import {
  connectSandboxFromEnv,
  createOrganizationWithSquareConnection,
  disconnectSquareConnection as disconnectConnection,
  getSquareConnection,
} from "@/lib/square/connection";
import {
  getSquareAccessToken,
  isSquareOAuthConfigured,
  isSquareSandboxTokenConfigured,
} from "@/lib/square/config";
import { createClient } from "@/lib/supabase/server";

export type SquareConnectOptions = {
  oauthEnabled: boolean;
  sandboxConnectEnabled: boolean;
};

export async function getSquareConnectOptions(): Promise<SquareConnectOptions> {
  return {
    oauthEnabled: isSquareOAuthConfigured(),
    sandboxConnectEnabled: isSquareSandboxTokenConfigured(),
  };
}

/** Creates an organization only after Square accepts the sandbox access token. */
export async function createOrganizationFromSandbox(
  name: string,
): Promise<{ error: string } | { organizationId: string; merchantId: string }> {
  if (!isSquareSandboxTokenConfigured()) {
    return { error: "SQUARE_ACCESS_TOKEN is not configured in .env.local." };
  }

  let merchantId: string;
  try {
    const profile = await squareSandboxFetch<{ merchant?: { id?: string } }>(
      "/v2/merchants/me",
    );
    if (!profile.merchant?.id) {
      return { error: "Square did not return a merchant id." };
    }
    merchantId = profile.merchant.id;
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not reach Square.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be signed in to create an organization." };
  }

  return createOrganizationWithSquareConnection(user.id, name, {
    merchantId,
    accessToken: getSquareAccessToken(),
    refreshToken: "",
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  });
}

export async function connectSandboxSquare(
  organizationId: string,
): Promise<{ error: string } | { merchantId: string }> {
  const result = await connectSandboxFromEnv(organizationId);
  if ("error" in result) {
    return { error: result.error };
  }
  return { merchantId: result.merchantId };
}

export async function getOrganizationSquareStatus(
  organizationId: string,
): Promise<{ connected: boolean; merchantId: string | null }> {
  const connection = await getSquareConnection(organizationId);
  if (!connection) {
    return { connected: false, merchantId: null };
  }
  return { connected: true, merchantId: connection.merchantId };
}

export async function disconnectSquare(
  organizationId: string,
): Promise<{ error: string } | Record<string, never>> {
  return disconnectConnection(organizationId);
}
