"use server";

import {
  connectSandboxFromEnv,
  disconnectSquareConnection as disconnectConnection,
  getSquareConnection,
} from "@/lib/square/connection";
import {
  isSquareOAuthConfigured,
  isSquareSandboxTokenConfigured,
} from "@/lib/square/config";

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
