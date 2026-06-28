export type StorageRoom = {
  id: string;
  name: string;
  description?: string;
  itemIds: string[];
};

export type StorageCatalogItem = {
  id: string;
  name: string;
  reportingUnit: string;
  par: number;
  onHand: number;
};

export type SavedRoomCheckEntry = {
  itemId: string;
  name: string;
  reportingUnit: string;
  previousOnHand: number;
  countedQty: number;
};

export type SavedRoomCheck = {
  id: string;
  roomId: string;
  roomName: string;
  savedAt: string;
  savedBy: string;
  entries: SavedRoomCheckEntry[];
};

export type CreateStorageRoomFormValues = {
  name: string;
  description: string;
};

export function createEmptyStorageRoomFormValues(): CreateStorageRoomFormValues {
  return { name: "", description: "" };
}

export type InventoryTab = "rooms" | "count" | "history";
