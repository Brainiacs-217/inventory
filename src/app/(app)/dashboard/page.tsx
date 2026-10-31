import { Suspense } from "react";

import { InventoryAlerts } from "@/component/InventoryAlerts";
import { ProfitOverTimeChart } from "@/component/ProfitOverTimeChart";
import { RecipeProfitChart, RecipeProfitChartSkeleton } from "@/component/RecipeProfitChart";
import { SquareOAuthNotice } from "@/component/SquareOAuthNotice";
import { getSelectedOrganizationId } from "@/lib/organizations/selectedOrg";
import { listTopItemSales } from "@/lib/sql/profit/queries";
import type { RecipeSalesByPeriod } from "@/types/dashboard";

const EMPTY_SALES: RecipeSalesByPeriod = {
  day: [],
  week: [],
  month: [],
  year: [],
};

export default async function DashboardPage() {
  const organizationId = await getSelectedOrganizationId();

  return (
    <div className="page-enter flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
      <Suspense fallback={null}>
        <SquareOAuthNotice />
      </Suspense>

      <Suspense fallback={<RecipeProfitChartSkeleton />}>
        <RecipeProfitSection organizationId={organizationId} />
      </Suspense>

      <div className="flex shrink-0 flex-col gap-4 lg:flex-row lg:items-stretch">
        <div className="flex min-w-0 flex-1 flex-col">
          <ProfitOverTimeChart data={[]} />
        </div>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <InventoryAlerts counts={[]} />
        </div>
      </div>
    </div>
  );
}

async function RecipeProfitSection({
  organizationId,
}: {
  organizationId: string | null;
}) {
  const salesByPeriod = organizationId
    ? await listTopItemSales(organizationId)
    : EMPTY_SALES;

  return <RecipeProfitChart data={salesByPeriod} />;
}
