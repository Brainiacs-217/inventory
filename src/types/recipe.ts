export type RecipeIngredientInput = {
  id: string;
  itemId: string;
  quantity: string;
  unit: string;
};

export type Recipe = {
  id: string;
  name: string;
  yieldQuantity: number | null;
  yieldUnit: string | null;
  servingSizeQuantity: number | null;
  servingSizeUnit: string | null;
  salesPrice: number;
  miscCost: number;
  foodCost: number;
  menuPrice: number;
  ingredientCount: number;
};

export type CreateRecipeFormValues = {
  name: string;
  ingredients: RecipeIngredientInput[];
  salesPrice: string;
  miscCost: string;
  yieldQuantity: string;
  yieldUnit: string;
  servingSizeQuantity: string;
  servingSizeUnit: string;
};

export function createEmptyRecipeFormValues(): CreateRecipeFormValues {
  return {
    name: "",
    ingredients: [],
    salesPrice: "",
    miscCost: "",
    yieldQuantity: "",
    yieldUnit: "",
    servingSizeQuantity: "",
    servingSizeUnit: "",
  };
}

export function createRecipeIngredientInput(
  itemId: string,
  unit: string,
): RecipeIngredientInput {
  return {
    id: crypto.randomUUID(),
    itemId,
    quantity: "",
    unit,
  };
}
