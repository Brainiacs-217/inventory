import type {
  Batch,
  BatchIngredientInput,
  CreateBatchFormValues,
} from "@/types/batch";
import type { Tables, TablesInsert } from "@/types/database";

function toNumericId(id: string): number {
  return Number(id);
}

function formatQuantity(value: number | string): string {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return "";
  return String(parseFloat(parsed.toFixed(4)));
}

type BatchIngredientRow = {
  id: number;
  item_id: number;
  quantity: number | string;
  unit_id: number;
};

export function mapFormToBatchInsert(
  values: CreateBatchFormValues,
  organizationId: string,
): TablesInsert<"batches"> {
  return {
    organization_id: organizationId,
    name: values.name.trim(),
    yield_quantity: Number(values.yieldQuantity),
    yield_unit_id: toNumericId(values.yieldUnitId),
  };
}

export function mapFormToBatchIngredientInserts(
  batchId: number,
  ingredients: BatchIngredientInput[],
): TablesInsert<"batch_ingredients">[] {
  return ingredients.map((ingredient) => ({
    batch_id: batchId,
    item_id: toNumericId(ingredient.itemId),
    quantity: Number(ingredient.quantity),
    unit_id: toNumericId(ingredient.unitId),
  }));
}

export function mapBatchRowToBatch(
  row: Tables<"batches"> & { batch_ingredients?: BatchIngredientRow[] | null },
  yieldUnitSymbol: string,
): Batch {
  const ingredients = (row.batch_ingredients ?? []).map((ingredient) => ({
    id: String(ingredient.id),
    itemId: String(ingredient.item_id),
    quantity: formatQuantity(ingredient.quantity),
    unitId: String(ingredient.unit_id),
  }));

  return {
    id: String(row.id),
    name: row.name,
    createdAt: row.created_at,
    yieldQuantity: Number(row.yield_quantity),
    yieldUnitId: String(row.yield_unit_id),
    yieldUnitSymbol,
    ingredientCount: ingredients.length,
    totalCost: null,
    ingredients,
  };
}
