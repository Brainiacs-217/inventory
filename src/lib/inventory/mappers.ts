import { formatReportingUnitDisplay } from "@/types/item";
import type { StorageCatalogItem, StorageRoom } from "@/types/storage";
import type { Tables } from "@/types/database";

export function mapItemRowToStorageCatalogItem(row: Tables<"items">): StorageCatalogItem {
  return {
    id: row.id,
    name: row.name,
    reportingUnit: formatReportingUnitDisplay(
      row.unit_name,
      String(row.unit_size),
      row.unit_of_measure,
    ),
    par: row.par_level ?? 0,
    onHand: row.on_hand ?? 0,
  };
}

export function mapStorageRoomRow(
  row: Tables<"storage_rooms"> & { storage_room_items?: { item_id: string }[] },
): StorageRoom {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    itemIds: row.storage_room_items?.map((entry) => entry.item_id) ?? [],
  };
}
