import { InventoryAlerts } from "@/component/InventoryAlerts";
import { ProfitOverTimeChart } from "@/component/ProfitOverTimeChart";
import { RecipeProfitChart } from "@/component/RecipeProfitChart";
import { SquareConnectBanner } from "@/component/SquareConnectBanner";
import { isSquareConfigured } from "@/lib/square/config";

export default function DashboardPage() {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <SquareConnectBanner connectEnabled={isSquareConfigured()} />

      <ProfitOverTimeChart data={[]} />

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
        <RecipeProfitChart data={[]} />
        <InventoryAlerts counts={[]} />
      </div>
    </div>
  );
}
