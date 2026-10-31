import "server-only";

import { SquareApiError } from "@/lib/square/client";
import { listSquareCatalogItems } from "@/lib/square/sync/catalog";
import { listCompletedSales } from "@/lib/square/sync/orders";
import {
  accessTokenForSync,
  listSyncConnections,
  loadSyncConnection,
  readTimestamp,
  type SquareConnectionRow,
} from "@/lib/square/sync/tokens";
import {
  listKnownLocationIds,
  markSquareSynced,
  upsertSquareItems,
  upsertSquareSales,
} from "@/lib/square/sync/write";

const BACKFILL_MS = 90 * 24 * 60 * 60 * 1000;
const OVERLAP_MS = 2 * 24 * 60 * 60 * 1000;

export type SyncOrganizationResult = {
  organizationId: string;
  itemsUpserted: number;
  salesUpserted: number;
  refreshedToken: boolean;
};

export type SyncFailure = {
  organizationId: string;
  error: string;
};

export type SyncBatchResult = {
  results: SyncOrganizationResult[];
  failures: SyncFailure[];
};

function closedAfter(lastSyncedAt: Date | null): Date {
  if (!lastSyncedAt) return new Date(Date.now() - BACKFILL_MS);
  return new Date(lastSyncedAt.getTime() - OVERLAP_MS);
}

export function publicSyncError(error: unknown): string {
  if (error instanceof SquareApiError) return error.message;
  if (error instanceof Error && error.name !== "PostgresError") {
    const safe =
      error.message.startsWith("Square") ||
      error.message.startsWith("No Square") ||
      error.message.startsWith("Stored Square") ||
      error.message.includes("is not set");
    if (safe) return error.message;
  }
  return "Square sync failed.";
}

async function syncConnection(row: SquareConnectionRow): Promise<SyncOrganizationResult> {
  const { accessToken, refreshed } = await accessTokenForSync(row);
  const items = await listSquareCatalogItems(accessToken);
  const itemsUpserted = await upsertSquareItems(row.organization_id, items);

  const locationIds = await listKnownLocationIds(row.organization_id);
  const sales = await listCompletedSales(
    accessToken,
    locationIds,
    closedAfter(readTimestamp(row.last_synced_at)),
  );
  const salesUpserted = await upsertSquareSales(row.organization_id, sales);
  await markSquareSynced(row.organization_id, new Date());

  return {
    organizationId: row.organization_id,
    itemsUpserted,
    salesUpserted,
    refreshedToken: refreshed,
  };
}

/** Sync one organization's catalog and completed sales. */
export async function syncOrganization(organizationId: string): Promise<SyncOrganizationResult> {
  const row = await loadSyncConnection(organizationId);
  if (!row) {
    throw new Error("Square is not connected for this organization.");
  }
  return syncConnection(row);
}

/** Sync every connected organization. One failure does not stop the others. */
export async function syncAllOrganizations(): Promise<SyncBatchResult> {
  const rows = await listSyncConnections();
  const results: SyncOrganizationResult[] = [];
  const failures: SyncFailure[] = [];

  for (const row of rows) {
    try {
      results.push(await syncConnection(row));
    } catch (error) {
      console.error(
        "Square sync failed",
        row.organization_id,
        error instanceof Error ? error.message : error,
      );
      failures.push({
        organizationId: row.organization_id,
        error: publicSyncError(error),
      });
    }
  }

  return { results, failures };
}
