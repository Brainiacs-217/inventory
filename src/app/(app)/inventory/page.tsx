import { InventoryAlerts } from "@/component/InventoryAlerts";
import { MOCK_INVENTORY_COUNTS } from "@/lib/mock/inventory";

export default function InventoryPage() {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <div className="shrink-0">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          Inventory
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Items that need attention based on par levels and count dates.
        </p>
      </div>
      <div className="min-h-0 flex-1">
        <InventoryAlerts counts={MOCK_INVENTORY_COUNTS} />
      </div>
    </div>
  );
}
