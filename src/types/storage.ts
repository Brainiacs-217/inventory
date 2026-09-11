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

export type CreateStorageRoomFormValues = {
  name: string;
  description: string;
};

export function createEmptyStorageRoomFormValues(): CreateStorageRoomFormValues {
  return { name: "", description: "" };
}

export type InventoryTab = "rooms" | "count";
