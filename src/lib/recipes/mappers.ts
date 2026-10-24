import type {
  CreateRecipeFormValues,
  Recipe,
  RecipeIngredientInput,
} from "@/types/recipe";
import type { Tables, TablesInsert } from "@/types/database";

function toNumericId(id: string): number {
  return Number(id);
}

function formatQuantity(value: number | string): string {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return "";
  return String(parseFloat(parsed.toFixed(4)));
}

type RecipeIngredientRow = {
  id: number;
  item_id: number | null;
  batch_id: number | null;
  quantity: number | string;
  unit_id: number;
  role: string;
  note: string | null;
};

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
  row: Tables<"recipes"> & { recipe_ingredients?: RecipeIngredientRow[] },
): Recipe {
  const ingredients = (row.recipe_ingredients ?? []).map((ingredient) => {
    const source = ingredient.batch_id != null ? "batch" : "item";
    return {
      id: String(ingredient.id),
      source,
      itemId: source === "item" && ingredient.item_id != null ? String(ingredient.item_id) : null,
      batchId:
        source === "batch" && ingredient.batch_id != null
          ? String(ingredient.batch_id)
          : null,
      quantity: formatQuantity(ingredient.quantity),
      unitId: String(ingredient.unit_id),
      role: ingredient.role === "garnish" ? "garnish" : "ingredient",
      note: ingredient.note ?? "",
    } as const;
  });

  return {
    id: String(row.id),
    name: row.name,
    createdAt: row.created_at,
    ingredientCount: ingredients.length,
    ingredients: [...ingredients],
  };
}

