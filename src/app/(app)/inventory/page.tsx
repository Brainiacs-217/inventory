import { InventoryPage } from "@/component/InventoryPage";
import { getOrganizationInventory } from "@/lib/inventory/queries";
import { getSelectedOrganizationId } from "@/lib/organizations/selectedOrg";

export default async function Page() {
  const organizationId = await getSelectedOrganizationId();
  const inventory = organizationId
    ? await getOrganizationInventory(organizationId)
    : { rooms: [], catalogItems: [], history: [] };

  return (
    <InventoryPage
      organizationId={organizationId}
      rooms={inventory.rooms}
      catalogItems={inventory.catalogItems}
      history={inventory.history}
    />
  );
}
