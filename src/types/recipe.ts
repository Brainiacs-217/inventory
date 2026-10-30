export type RecipeIngredientRole = "ingredient" | "garnish";
export type RecipeIngredientSource = "item" | "batch";

export type RecipeIngredientInput = {
  id: string;
  source: RecipeIngredientSource;
  itemId: string | null;
  batchId: string | null;
  quantity: string;
  unitId: string;
  role: RecipeIngredientRole;
  note: string;
};

export type Recipe = {
  id: string;
  name: string;
  createdAt: string;
  ingredientCount: number;
  cog: number | null;
  ingredients: RecipeIngredientInput[];
};

export type CreateRecipeFormValues = {
  name: string;
  ingredients: RecipeIngredientInput[];
};

export type UnitOption = {
  id: string;
  name: string;
  symbol: string;
  measurementType: "volume" | "mass" | "count";
};

export type BatchOption = {
  id: string;
  name: string;
};

export function createEmptyRecipeFormValues(): CreateRecipeFormValues {
  return {
    name: "",
    ingredients: [],
  };
}

export function createRecipeIngredientInput(values: {
  source: RecipeIngredientSource;
  itemId?: string;
  batchId?: string;
  quantity: string;
  unitId: string;
  role?: RecipeIngredientRole;
  note?: string;
}): RecipeIngredientInput {
  return {
    id: crypto.randomUUID(),
    source: values.source,
    itemId: values.source === "item" ? (values.itemId ?? null) : null,
    batchId: values.source === "batch" ? (values.batchId ?? null) : null,
    quantity: values.quantity,
    unitId: values.unitId,
    role: values.role ?? "ingredient",
    note: values.note ?? "",
  };
}
