import "server-only";

import { squareFetch } from "@/lib/square/client";

export type SquareSaleLine = {
  squareOrderId: string;
  squareLineUid: string;
  squareVariationId: string | null;
  itemName: string;
  quantity: string;
  revenueCents: number;
  soldAt: string;
  locationId: string | null;
};

type SquareMoney = {
  amount?: number;
  currency?: string;
};

type SquareLineItem = {
  uid?: string;
  name?: string;
  quantity?: string;
  catalog_object_id?: string;
  gross_sales_money?: SquareMoney;
  total_discount_money?: SquareMoney;
  total_tax_money?: SquareMoney;
  total_money?: SquareMoney;
};

type SquareOrder = {
  id?: string;
  location_id?: string;
  state?: string;
  closed_at?: string;
  line_items?: SquareLineItem[];
};

type OrderSearchResponse = {
  orders?: SquareOrder[];
  cursor?: string;
};

const ORDER_PAGE_SIZE = 100;
const LOCATION_CHUNK_SIZE = 10;

function cents(money: SquareMoney | undefined): number {
  const amount = money?.amount;
  return typeof amount === "number" && Number.isFinite(amount) ? Math.trunc(amount) : 0;
}

/** Gross sales minus discounts. Tax is excluded. Amounts from Square are already cents. */
function revenueCents(line: SquareLineItem): number {
  if (line.gross_sales_money) {
    return cents(line.gross_sales_money) - cents(line.total_discount_money);
  }
  return cents(line.total_money) - cents(line.total_tax_money);
}

function chunks<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }
  return batches;
}

function saleLinesFromOrders(
  orders: SquareOrder[],
  knownLocationIds: ReadonlySet<string>,
): SquareSaleLine[] {
  const lines: SquareSaleLine[] = [];

  for (const order of orders) {
    if (!order.id || order.state !== "COMPLETED" || !order.closed_at) continue;
    const locationId =
      order.location_id && knownLocationIds.has(order.location_id) ? order.location_id : null;

    for (const line of order.line_items ?? []) {
      const itemName = line.name?.trim();
      const quantity = line.quantity?.trim();
      if (!line.uid || !itemName || !quantity || !Number.isFinite(Number(quantity))) continue;

      lines.push({
        squareOrderId: order.id,
        squareLineUid: line.uid,
        squareVariationId: line.catalog_object_id?.trim() || null,
        itemName,
        quantity,
        revenueCents: revenueCents(line),
        soldAt: order.closed_at,
        locationId,
      });
    }
  }

  return lines;
}

async function searchCompletedOrders(
  accessToken: string,
  locationIds: string[],
  closedAfter: Date,
): Promise<SquareOrder[]> {
  const orders: SquareOrder[] = [];
  let cursor: string | undefined;
  const seenCursors = new Set<string>();
  let pages = 0;

  do {
    const page = await squareFetch<OrderSearchResponse>(accessToken, "/v2/orders/search", {
      method: "POST",
      body: JSON.stringify({
        location_ids: locationIds,
        limit: ORDER_PAGE_SIZE,
        ...(cursor ? { cursor } : {}),
        query: {
          filter: {
            state_filter: { states: ["COMPLETED"] },
            date_time_filter: {
              closed_at: { start_at: closedAfter.toISOString() },
            },
          },
          sort: { sort_field: "CLOSED_AT", sort_order: "ASC" },
        },
      }),
    });

    orders.push(...(page.orders ?? []));
    pages += 1;
    if (!page.cursor || seenCursors.has(page.cursor)) break;
    if (pages >= 500) {
      throw new Error("Square orders sync did not finish because Square kept returning pages.");
    }
    seenCursors.add(page.cursor);
    cursor = page.cursor;
  } while (cursor);

  return orders;
}

/** Completed order lines closed at or after `closedAfter`, for locations already stored. */
export async function listCompletedSales(
  accessToken: string,
  locationIds: string[],
  closedAfter: Date,
): Promise<SquareSaleLine[]> {
  if (locationIds.length === 0) {
    throw new Error(
      "No Square location is stored for this organization, so sales cannot be synced.",
    );
  }

  const knownLocationIds = new Set(locationIds);
  const byLine = new Map<string, SquareSaleLine>();

  for (const locationChunk of chunks(locationIds, LOCATION_CHUNK_SIZE)) {
    const orders = await searchCompletedOrders(accessToken, locationChunk, closedAfter);
    for (const line of saleLinesFromOrders(orders, knownLocationIds)) {
      byLine.set(`${line.squareOrderId}\0${line.squareLineUid}`, line);
    }
  }

  return [...byLine.values()];
}
