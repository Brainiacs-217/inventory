import type {
  CreateRecipeFormValues,
  Recipe,
  RecipeIngredientInput,
} from "@/types/recipe";
import type { Tables, TablesInsert } from "@/types/database";

function toNumericId(id: string): number {
  return Number(id);
}

export function mapFormToRecipeInsert(
  values: CreateRecipeFormValues,
  organizationId: string,
): TablesInsert<"recipes"> {
  return {
    organization_id: organizationId,
    name: values.name.trim(),
  };
}

export function mapFormToRecipeIngredientInserts(
  recipeId: number,
  ingredients: RecipeIngredientInput[],
): TablesInsert<"recipe_ingredients">[] {
  return ingredients.map((ingredient) => ({
    recipe_id: recipeId,
    item_id:
      ingredient.source === "item" && ingredient.itemId
        ? toNumericId(ingredient.itemId)
        : null,
    batch_id:
      ingredient.source === "batch" && ingredient.batchId
        ? toNumericId(ingredient.batchId)
        : null,
    quantity: parseFloat(ingredient.quantity),
    unit_id: toNumericId(ingredient.unitId),
    role: ingredient.role,
    note: ingredient.note.trim() || null,
  }));
}

export function mapRecipeRowToRecipe(
  row: Tables<"recipes"> & { recipe_ingredients?: { id: number }[] },
): Recipe {
  return {
    id: String(row.id),
    name: row.name,
    createdAt: row.created_at,
    ingredientCount: row.recipe_ingredients?.length ?? 0,
  };
}

