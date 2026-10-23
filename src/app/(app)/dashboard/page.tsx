import { Suspense } from "react";

import { InventoryAlerts } from "@/component/InventoryAlerts";
import { ProfitOverTimeChart } from "@/component/ProfitOverTimeChart";
import { RecipeProfitChart } from "@/component/RecipeProfitChart";
import { SquareConnectBanner } from "@/component/SquareConnectBanner";
import { getSelectedOrganizationId } from "@/lib/organizations/selectedOrg";
import { isSquareConfigured, isSquareOAuthConfigured, isSquareSandboxTokenConfigured } from "@/lib/square/config";
import { getSquareConnection } from "@/lib/square/connection";

export default async function DashboardPage() {
  const organizationId = await getSelectedOrganizationId();
  const connection = organizationId
    ? await getSquareConnection(organizationId)
    : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
      <Suspense fallback={null}>
        <SquareConnectBanner
          connectEnabled={isSquareConfigured()}
          oauthEnabled={isSquareOAuthConfigured()}
          sandboxConnectEnabled={isSquareSandboxTokenConfigured()}
          connected={connection != null}
          merchantId={connection?.merchantId ?? null}
          organizationId={organizationId}
        />
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
