import {
  mapItemRowToStorageCatalogItem,
  mapStorageRoomRow,
} from "@/lib/inventory/mappers";
import { createClient } from "@/lib/supabase/server";
import type { StorageCatalogItem, StorageRoom } from "@/types/storage";
import type { Tables } from "@/types/database";

export type OrganizationInventoryData = {
  rooms: StorageRoom[];
  catalogItems: StorageCatalogItem[];
};

export async function getOrganizationInventory(
  organizationId: string,
): Promise<OrganizationInventoryData> {
  const empty = { rooms: [], catalogItems: [] };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return empty;

  const [roomsResult, itemsResult] = await Promise.all([
    supabase
      .from("storage_rooms")
      .select("*, storage_room_items(item_id)")
      .eq("organization_id", organizationId)
      .order("name"),
    supabase
      .from("items")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .order("name"),
  ]);

  return {
    rooms: (roomsResult.data ?? []).map((row) =>
      mapStorageRoomRow(
        row as Tables<"storage_rooms"> & { storage_room_items: { item_id: string }[] },
      ),
    ),
    catalogItems: (itemsResult.data ?? []).map((row) =>
      mapItemRowToStorageCatalogItem(row as Tables<"items">),
    ),
  };
}
