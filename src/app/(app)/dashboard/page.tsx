import { Suspense } from "react";

import { InventoryAlerts } from "@/component/InventoryAlerts";
import { ProfitOverTimeChart } from "@/component/ProfitOverTimeChart";
import { RecipeProfitChart } from "@/component/RecipeProfitChart";
import { SquareOAuthNotice } from "@/component/SquareOAuthNotice";

export default function DashboardPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
      <Suspense fallback={null}>
        <SquareOAuthNotice />
      </Suspense>

      <ProfitOverTimeChart data={[]} />

      <div className="flex shrink-0 flex-col gap-4 lg:flex-row lg:items-stretch">
        <div className="flex min-w-0 flex-1 flex-col">
          <RecipeProfitChart data={[]} />
        </div>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <InventoryAlerts counts={[]} />
        </div>
      </div>
    </div>
  );
}
