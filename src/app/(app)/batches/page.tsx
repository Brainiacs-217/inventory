import { BatchesTable } from "@/component/BatchesTable";
import { getOrganizationBatchList } from "@/lib/batches/queries";
import { getOrganizationItems } from "@/lib/items/queries";
import { getSelectedOrganizationId } from "@/lib/organizations/selectedOrg";
import { getUnits } from "@/lib/units/queries";

export default async function BatchesPage() {
  const organizationId = await getSelectedOrganizationId();
  const [batches, catalogItems, units] = organizationId
    ? await Promise.all([
        getOrganizationBatchList(organizationId),
        getOrganizationItems(organizationId),
        getUnits(),
      ])
    : [[], [], []];

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <BatchesTable
        batches={batches}
        catalogItems={catalogItems}
        units={units}
        organizationId={organizationId}
      />
    </div>
  );
}
