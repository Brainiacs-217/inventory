export type Batch = {
  id: string;
  name: string;
  createdAt: string;
  yieldQuantity: number;
  yieldUnitId: string;
  yieldUnitSymbol: string;
  ingredientCount: number;
  ingredients: BatchIngredientInput[];
};

export type BatchIngredientInput = {
  id: string;
  itemId: string;
  quantity: string;
  unitId: string;
};

export type CreateBatchFormValues = {
  name: string;
  yieldQuantity: string;
  yieldUnitId: string;
  ingredients: BatchIngredientInput[];
};

export function createEmptyBatchFormValues(): CreateBatchFormValues {
  return {
    name: "",
    yieldQuantity: "",
    yieldUnitId: "",
    ingredients: [],
  };
}

export function createBatchIngredientInput(values: {
  itemId: string;
  quantity: string;
  unitId: string;
}): BatchIngredientInput {
  return {
    id: crypto.randomUUID(),
    itemId: values.itemId,
    quantity: values.quantity,
    unitId: values.unitId,
  };
}

export function formatBatchYield(quantity: number, symbol: string): string {
  if (!Number.isFinite(quantity)) return "—";
  const amount = Number.isInteger(quantity)
    ? String(quantity)
    : String(Number(quantity.toFixed(4)));
  const unit = symbol.trim();
  return unit ? `${amount} ${unit}` : amount;
}
