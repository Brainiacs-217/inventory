import { getSql } from "@/lib/sql/client";

export type IngredientPackageRow = {
  item_id: string;
  ingredient_name: string;
  package_id: string;
  purchase_price: string | null;
  total_standard_quantity: string;
  cost_per_standard_unit: string | null;
};

/** Every package price for the organization, including the standard-unit cost. */
export function listIngredientPackages(organizationId: string) {
  return getSql()<IngredientPackageRow[]>`
    select
      ip.item_id,
      i.name as ingredient_name,
      ip.id as package_id,
      ip.purchase_price,
      (
        ip.units_per_package
        * ip.unit_size
        * u.conversion_to_standard
      ) as total_standard_quantity,
      (
        ip.purchase_price / nullif(
          ip.units_per_package
          * ip.unit_size
          * u.conversion_to_standard,
          0
        )
      ) as cost_per_standard_unit
    from item_packages as ip
    join items as i on i.id = ip.item_id
    join units as u on u.id = ip.unit_id
    where i.organization_id = ${organizationId}
  `;
}
