import "server-only";

import { squareFetch } from "@/lib/square/client";

export type SquareCatalogItem = {
  squareVariationId: string;
  name: string;
};

type CatalogVariation = {
  id?: string;
  is_deleted?: boolean;
  item_variation_data?: {
    name?: string;
  };
};

type CatalogItem = {
  type?: string;
  is_deleted?: boolean;
  item_data?: {
    name?: string;
    variations?: CatalogVariation[];
  };
};

type CatalogListResponse = {
  objects?: CatalogItem[];
  cursor?: string;
};

/** Parent item name, with the variation appended when it is not "Regular". */
export function squareItemName(itemName: string, variationName: string | undefined): string {
  const item = itemName.trim();
  const variation = variationName?.trim();
  if (!variation || variation.toLowerCase() === "regular") return item;
  return `${item} (${variation})`;
}

/** Every sellable catalog variation for the connected merchant. */
export async function listSquareCatalogItems(accessToken: string): Promise<SquareCatalogItem[]> {
  const byVariationId = new Map<string, SquareCatalogItem>();
  let cursor: string | undefined;
  const seenCursors = new Set<string>();
  let pages = 0;

  do {
    const params = new URLSearchParams({ types: "ITEM" });
    if (cursor) params.set("cursor", cursor);

    const page = await squareFetch<CatalogListResponse>(
      accessToken,
      `/v2/catalog/list?${params.toString()}`,
    );

    for (const item of page.objects ?? []) {
      if (item.type !== "ITEM" || item.is_deleted) continue;
      const itemName = item.item_data?.name?.trim();
      if (!itemName) continue;

      for (const variation of item.item_data?.variations ?? []) {
        if (!variation.id || variation.is_deleted) continue;
        byVariationId.set(variation.id, {
          squareVariationId: variation.id,
          name: squareItemName(itemName, variation.item_variation_data?.name),
        });
      }
    }

    pages += 1;
    if (!page.cursor || seenCursors.has(page.cursor)) break;
    if (pages >= 500) {
      throw new Error("Square catalog sync did not finish because Square kept returning pages.");
    }
    seenCursors.add(page.cursor);
    cursor = page.cursor;
  } while (cursor);

  return [...byVariationId.values()];
}
