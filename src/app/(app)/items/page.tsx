import { ItemsTable } from "@/component/ItemsTable";
import { getOrganizationItems } from "@/lib/items/queries";
import { getSelectedOrganizationId } from "@/lib/organizations/selectedOrg";

export default async function ItemsPage() {
  const organizationId = await getSelectedOrganizationId();
  const items = organizationId ? await getOrganizationItems(organizationId) : [];

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <ItemsTable items={items} organizationId={organizationId} />
    </div>
  );
}
