import { RecipesTable } from "@/component/RecipesTable";
import { getOrganizationItems } from "@/lib/items/queries";
import { getSelectedOrganizationId } from "@/lib/organizations/selectedOrg";
import { getOrganizationRecipes } from "@/lib/recipes/queries";

export default async function RecipesPage() {
  const organizationId = await getSelectedOrganizationId();
  const [recipes, catalogItems] = organizationId
    ? await Promise.all([
        getOrganizationRecipes(organizationId),
        getOrganizationItems(organizationId),
      ])
    : [[], []];

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <RecipesTable
        recipes={recipes}
        catalogItems={catalogItems}
        organizationId={organizationId}
      />
    </div>
  );
}
