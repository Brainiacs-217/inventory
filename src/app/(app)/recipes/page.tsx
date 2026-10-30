import { RecipesTable } from "@/component/RecipesTable";
import { getOrganizationBatches } from "@/lib/batches/queries";
import { getOrganizationItems } from "@/lib/items/queries";
import { getSelectedOrganizationId } from "@/lib/organizations/selectedOrg";
import { getOrganizationRecipes } from "@/lib/recipes/queries";
import { getUnits } from "@/lib/units/queries";

export default async function RecipesPage() {
  const organizationId = await getSelectedOrganizationId();
  const [recipes, catalogItems, batches, units] = organizationId
    ? await Promise.all([
        getOrganizationRecipes(organizationId),
        getOrganizationItems(organizationId),
        getOrganizationBatches(organizationId),
        getUnits(),
      ])
    : [[], [], [], []];

  return (
    <div className="page-enter flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <RecipesTable
        recipes={recipes}
        catalogItems={catalogItems}
        batches={batches}
        units={units}
        organizationId={organizationId}
      />
    </div>
  );
}
