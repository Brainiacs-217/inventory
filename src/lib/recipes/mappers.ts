import { parseOptionalNumber } from "@/lib/recipes/cost";
import type { CreateRecipeFormValues, Recipe } from "@/types/recipe";
import type { Tables, TablesInsert } from "@/types/database";

export function mapFormToRecipeInsert(
  values: CreateRecipeFormValues,
  organizationId: string,
  foodCost: number,
): TablesInsert<"recipes"> {
  return {
    organization_id: organizationId,
    name: values.name.trim(),
    yield_quantity: parseOptionalNumber(values.yieldQuantity),
    yield_unit: values.yieldUnit.trim() || null,
    serving_size_quantity: parseOptionalNumber(values.servingSizeQuantity),
    serving_size_unit: values.servingSizeUnit.trim() || null,
    sales_price: parseFloat(values.salesPrice) || 0,
    misc_cost: parseFloat(values.miscCost) || 0,
    food_cost: foodCost,
  };
}

export function mapRecipeRowToRecipe(
  row: Tables<"recipes"> & { recipe_ingredients?: { id: string }[] },
): Recipe {
  return {
    id: row.id,
    name: row.name,
    yieldQuantity: row.yield_quantity,
    yieldUnit: row.yield_unit,
    servingSizeQuantity: row.serving_size_quantity,
    servingSizeUnit: row.serving_size_unit,
    salesPrice: row.sales_price,
    miscCost: row.misc_cost,
    foodCost: row.food_cost,
    menuPrice: row.sales_price,
    ingredientCount: row.recipe_ingredients?.length ?? 0,
  };
}
