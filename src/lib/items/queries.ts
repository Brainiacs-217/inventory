import { mapItemRowToInventoryItem } from "@/lib/items/mappers";
import { createClient } from "@/lib/supabase/server";
import type { InventoryItem } from "@/types/item";
import type { Tables } from "@/types/database";

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
    .select("*")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .order("name");

  if (error) return [];

  return (data ?? []).map((row) => mapItemRowToInventoryItem(row as Tables<"items">));
}
