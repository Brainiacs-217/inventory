import type {
  Batch,
  BatchIngredientInput,
  CreateBatchFormValues,
} from "@/types/batch";
import type { Tables, TablesInsert } from "@/types/database";

function toNumericId(id: string): number {
  return Number(id);
}

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
  row: Tables<"batches"> & { batch_ingredients?: { id: number }[] | null },
  yieldUnitSymbol: string,
): Batch {
  return {
    id: String(row.id),
    name: row.name,
    createdAt: row.created_at,
    yieldQuantity: Number(row.yield_quantity),
    yieldUnitSymbol,
    ingredientCount: row.batch_ingredients?.length ?? 0,
  };
}
