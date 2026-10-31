import "server-only";

import type { SquareCatalogItem } from "@/lib/square/sync/catalog";
import type { SquareSaleLine } from "@/lib/square/sync/orders";
import { getSql } from "@/lib/sql/client";

const INSERT_BATCH_SIZE = 200;

type ItemIdRow = {
  id: string | number;
  square_variation_id: string;
};

type SquareItemInsert = {
  organization_id: string;
  square_variation_id: string;
  name: string;
};

type SquareSaleInsert = {
  organization_id: string;
  square_order_id: string;
  square_line_uid: string;
  square_item_id: string | null;
  item_name: string;
  quantity: string;
  revenue_cents: number;
  sold_at: string;
  location_id: string | null;
};

function chunks<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }
  return batches;
}

export async function listKnownLocationIds(organizationId: string): Promise<string[]> {
  const rows = await getSql()<{ id: string }[]>`
    select id
    from square_locations
    where organization_id = ${organizationId}
  `;
  return rows.map((row) => row.id);
}

/** Upsert catalog variations. `recipe_id` is left unchanged. */
export async function upsertSquareItems(
  organizationId: string,
  items: SquareCatalogItem[],
): Promise<number> {
  const byVariationId = new Map<string, SquareItemInsert>();
  for (const item of items) {
    byVariationId.set(item.squareVariationId, {
      organization_id: organizationId,
      square_variation_id: item.squareVariationId,
      name: item.name,
    });
  }

  const rows = [...byVariationId.values()];
  if (rows.length === 0) return 0;

  const sql = getSql();
  for (const batch of chunks(rows, INSERT_BATCH_SIZE)) {
    await sql`
      insert into square_items ${sql(batch, "organization_id", "square_variation_id", "name")}
      on conflict (organization_id, square_variation_id)
      do update set name = excluded.name
    `;
  }

  return rows.length;
}

async function loadSquareItemIds(
  organizationId: string,
  variationIds: string[],
): Promise<Map<string, string>> {
  const ids = new Map<string, string>();
  if (variationIds.length === 0) return ids;

  const sql = getSql();
  for (const batch of chunks(variationIds, INSERT_BATCH_SIZE)) {
    const rows = await sql<ItemIdRow[]>`
      select id, square_variation_id
      from square_items
      where organization_id = ${organizationId}
        and square_variation_id in ${sql(batch)}
    `;
    for (const row of rows) {
      ids.set(row.square_variation_id, String(row.id));
    }
  }

  return ids;
}

/** Upsert sale lines. `ingredient_cost_cents` is left null. */
export async function upsertSquareSales(
  organizationId: string,
  lines: SquareSaleLine[],
): Promise<number> {
  if (lines.length === 0) return 0;

  const variationIds = [
    ...new Set(
      lines.flatMap((line) => (line.squareVariationId ? [line.squareVariationId] : [])),
    ),
  ];
  const itemIds = await loadSquareItemIds(organizationId, variationIds);

  const rows: SquareSaleInsert[] = lines.map((line) => ({
    organization_id: organizationId,
    square_order_id: line.squareOrderId,
    square_line_uid: line.squareLineUid,
    square_item_id: line.squareVariationId ? (itemIds.get(line.squareVariationId) ?? null) : null,
    item_name: line.itemName,
    quantity: line.quantity,
    revenue_cents: line.revenueCents,
    sold_at: line.soldAt,
    location_id: line.locationId,
  }));

  const sql = getSql();
  for (const batch of chunks(rows, INSERT_BATCH_SIZE)) {
    await sql`
      insert into square_sales ${sql(
        batch,
        "organization_id",
        "square_order_id",
        "square_line_uid",
        "square_item_id",
        "item_name",
        "quantity",
        "revenue_cents",
        "sold_at",
        "location_id",
      )}
      on conflict (organization_id, square_order_id, square_line_uid)
      do update set
        square_item_id = excluded.square_item_id,
        item_name = excluded.item_name,
        quantity = excluded.quantity,
        revenue_cents = excluded.revenue_cents,
        sold_at = excluded.sold_at,
        location_id = excluded.location_id
    `;
  }

  return rows.length;
}

export async function markSquareSynced(organizationId: string, syncedAt: Date): Promise<void> {
  await getSql()`
    update square_connections
    set last_synced_at = ${syncedAt}
    where organization_id = ${organizationId}
  `;
}
