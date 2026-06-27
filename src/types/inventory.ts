export type InventoryCount = {
  itemId: string;
  name: string;
  reportingUnit: string;
  onHand: number;
  par: number;
  lastCountedAt: string | null;
};

export type InventoryAlertType = "out_of_stock" | "below_par" | "stale_count";

export type InventoryAlert = {
  itemId: string;
  name: string;
  reportingUnit: string;
  type: InventoryAlertType;
  onHand: number;
  par: number;
  lastCountedAt: string | null;
};
