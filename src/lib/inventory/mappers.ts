import { formatReportingUnitDisplay } from "@/types/item";
import type {
  SavedRoomCheck,
  SavedRoomCheckEntry,
  StorageCatalogItem,
  StorageRoom,
} from "@/types/storage";
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

export function mapCheckRowToSavedRoomCheck(
  row: Tables<"inventory_checks"> & {
    storage_rooms: { name: string } | null;
    inventory_check_lines: Array<
      Tables<"inventory_check_lines"> & {
        items: Pick<Tables<"items">, "name" | "unit_name" | "unit_size" | "unit_of_measure"> | null;
      }
    >;
  },
): SavedRoomCheck {
  return {
    id: row.id,
    roomId: row.room_id,
    roomName: row.storage_rooms?.name ?? "Unknown room",
    savedAt: row.saved_at,
    savedBy: row.saved_by ?? "",
    entries: row.inventory_check_lines.map((line): SavedRoomCheckEntry => ({
      itemId: line.item_id,
      name: line.items?.name ?? "Unknown item",
      reportingUnit: line.items
        ? formatReportingUnitDisplay(
            line.items.unit_name,
            String(line.items.unit_size),
            line.items.unit_of_measure,
          )
        : "",
      previousOnHand: line.previous_on_hand,
      countedQty: line.counted_qty,
    })),
  };
}
