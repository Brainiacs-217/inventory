import {
  mapCheckRowToSavedRoomCheck,
  mapItemRowToStorageCatalogItem,
  mapStorageRoomRow,
} from "@/lib/inventory/mappers";
import { createClient } from "@/lib/supabase/server";
import type { SavedRoomCheck, StorageCatalogItem, StorageRoom } from "@/types/storage";
import type { Tables } from "@/types/database";

export type OrganizationInventoryData = {
  rooms: StorageRoom[];
  catalogItems: StorageCatalogItem[];
  history: SavedRoomCheck[];
};

export async function getOrganizationInventory(
  organizationId: string,
): Promise<OrganizationInventoryData> {
  const empty = { rooms: [], catalogItems: [], history: [] };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return empty;

  const [roomsResult, itemsResult, historyResult] = await Promise.all([
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
    supabase
      .from("inventory_checks")
      .select(
        "*, storage_rooms(name), inventory_check_lines(*, items(name, unit_name, unit_size, unit_of_measure))",
      )
      .eq("organization_id", organizationId)
      .order("saved_at", { ascending: false }),
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
    history: (historyResult.data ?? []).map((row) => mapCheckRowToSavedRoomCheck(row as never)),
  };
}
