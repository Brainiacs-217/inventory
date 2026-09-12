import { mapCatalogItemRow, type CatalogItemRow } from "@/lib/items/mappers";
import { createClient } from "@/lib/supabase/server";
import type { InventoryItem } from "@/types/item";

const ITEM_CATALOG_SELECT = `
  id,
  name,
  subcategory:subcategories (
    name,
    category:categories (
      name,
      item_type:item_types (
        name
      )
    )
  ),
  item_packages (
    sku,
    purchase_price,
    units_per_package,
    unit_size,
    vendor:vendors (
      name
    ),
    unit:units (
      name,
      symbol
    )
  )
`;

export async function getOrganizationItems(
  organizationId: string,
): Promise<InventoryItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("items")
    .select(ITEM_CATALOG_SELECT)
    .eq("organization_id", organizationId)
    .order("name");

  if (error) {
    console.error("Failed to load organization items:", error.message);
    return [];
  }

  return ((data ?? []) as unknown as CatalogItemRow[]).map(mapCatalogItemRow);
}
