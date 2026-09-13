import { ItemsTable } from "@/component/ItemsTable";
import { getOrganizationItems } from "@/lib/items/queries";
import { getSelectedOrganizationId } from "@/lib/organizations/selectedOrg";

export default async function ItemsPage() {
  const organizationId = await getSelectedOrganizationId();
  const items = organizationId ? await getOrganizationItems(organizationId) : [];

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <ItemsTable items={items} organizationId={organizationId} />
    </div>
  );
}
