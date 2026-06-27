export type Recipe = {
  id: string;
  name: string;
  category: string;
  yield: string;
  foodCost: number;
  menuPrice: number;
  ingredientCount: number;
  prepTimeMinutes: number | null;
  notes: string | null;
};

export type CreateRecipeFormValues = {
  name: string;
  category: string;
  yield: string;
  foodCost: string;
  menuPrice: string;
  prepTimeMinutes: string;
  notes: string;
};

export function createEmptyRecipeFormValues(): CreateRecipeFormValues {
  return {
    name: "",
    category: "",
    yield: "",
    foodCost: "",
    menuPrice: "",
    prepTimeMinutes: "",
    notes: "",
  };
}
