import { InventoryAlerts } from "@/component/InventoryAlerts";
import { ProfitOverTimeChart } from "@/component/ProfitOverTimeChart";
import { RecipeProfitChart } from "@/component/RecipeProfitChart";
import { SquareConnectBanner } from "@/component/SquareConnectBanner";
import { MOCK_MONTHLY_PROFIT, MOCK_RECIPE_SALES } from "@/lib/mock/dashboard";
import { MOCK_INVENTORY_COUNTS } from "@/lib/mock/inventory";

export default function DashboardPage() {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <SquareConnectBanner />

      <ProfitOverTimeChart data={MOCK_MONTHLY_PROFIT} />

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
        <RecipeProfitChart data={MOCK_RECIPE_SALES} />
        <InventoryAlerts counts={MOCK_INVENTORY_COUNTS} />
      </div>
    </div>
  );
}
