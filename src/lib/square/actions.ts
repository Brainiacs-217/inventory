"use server";

import {
  connectSandboxFromEnv,
  disconnectSquareConnection as disconnectConnection,
} from "@/lib/square/connection";

export async function connectSandboxSquare(
  organizationId: string,
): Promise<{ error: string } | Record<string, never>> {
  const result = await connectSandboxFromEnv(organizationId);
  if ("error" in result) {
    return { error: result.error };
  }
  return {};
}

export async function disconnectSquare(
  organizationId: string,
): Promise<{ error: string } | Record<string, never>> {
  return disconnectConnection(organizationId);
}
