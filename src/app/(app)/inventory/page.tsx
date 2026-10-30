import { Suspense } from "react";

import { InventoryPage } from "@/component/InventoryPage";
import { RouteLoading } from "@/component/RouteLoading";
import { getOrganizationInventory } from "@/lib/inventory/queries";
import { getSelectedOrganizationId } from "@/lib/organizations/selectedOrg";

export default function Page() {
  return (
    <Suspense fallback={<RouteLoading route="inventory" />}>
      <InventoryContent />
    </Suspense>
  );
}

async function InventoryContent() {
  const organizationId = await getSelectedOrganizationId();
  const inventory = organizationId
    ? await getOrganizationInventory(organizationId)
    : { rooms: [], catalogItems: [] };

  return (
    <InventoryPage
      organizationId={organizationId}
      rooms={inventory.rooms}
      catalogItems={inventory.catalogItems}
    />
  );
}
