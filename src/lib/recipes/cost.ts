import type { InventoryItem } from "@/types/item";
import type { RecipeIngredientInput } from "@/types/recipe";

const UNIT_ALIASES: Record<string, string> = {
  "fl. oz": "floz",
  floz: "floz",
  oz: "oz",
  lb: "lb",
  gal: "gal",
  each: "each",
  g: "g",
  kg: "kg",
};

const TO_OZ: Record<string, number> = {
  floz: 1,
  oz: 1,
  lb: 16,
  gal: 128,
  g: 0.035274,
  kg: 35.274,
};

function normalizeUnit(unit: string): string {
  const trimmed = unit.trim().toLowerCase();
  return UNIT_ALIASES[trimmed] ?? trimmed;
}

function parseReportingUnit(reportingUnit: string): {
  label: string;
  amount: number | null;
  measure: string | null;
} {
  const match = reportingUnit.match(/^(.+?)\s*\(([\d.]+)\s*(.+?)\)$/i);
  if (!match) {
    return { label: reportingUnit.trim(), amount: null, measure: null };
  }
  return {
    label: match[1].trim(),
    amount: parseFloat(match[2]),
    measure: match[3].trim(),
  };
}

function conversionFactor(fromUnit: string, toUnit: string): number | null {
  const from = normalizeUnit(fromUnit);
  const to = normalizeUnit(toUnit);
  if (from === to) return 1;

  const fromOz = TO_OZ[from];
  const toOz = TO_OZ[to];
  if (fromOz !== undefined && toOz !== undefined) {
    return fromOz / toOz;
  }
  return null;
}

/** Cost of one unit of `unit` based on the item's stored cost per reporting unit. */
export function getConvertedItemCostPerUnit(
  item: InventoryItem,
  unit: string,
): number {
  const parsed = parseReportingUnit(item.reportingUnit);
  const targetUnit = unit.trim();

  if (
    targetUnit === item.reportingUnit ||
    targetUnit === parsed.label ||
    normalizeUnit(targetUnit) === normalizeUnit(parsed.label)
  ) {
    return item.cost;
  }

  if (parsed.amount && parsed.measure) {
    const measureFactor = conversionFactor(parsed.measure, targetUnit);
    if (measureFactor !== null) {
      return item.cost / (parsed.amount * measureFactor);
    }
  }

  const directFactor = conversionFactor(parsed.label, targetUnit);
  if (directFactor !== null) {
    return item.cost / directFactor;
  }

  return item.cost;
}

export function computeIngredientCost(
  quantity: number,
  costPerUnit: number,
): number {
  if (!Number.isFinite(quantity) || quantity <= 0) return 0;
  return quantity * costPerUnit;
}

export function computeIngredientLineCost(
  ingredient: RecipeIngredientInput,
  item: InventoryItem,
): number {
  const quantity = parseFloat(ingredient.quantity);
  if (Number.isNaN(quantity) || quantity <= 0) return 0;
  const costPerUnit = getConvertedItemCostPerUnit(item, ingredient.unit);
  return computeIngredientCost(quantity, costPerUnit);
}

export function computeTotalIngredientCost(
  ingredients: RecipeIngredientInput[],
  itemsById: Map<string, InventoryItem>,
): number {
  return ingredients.reduce((sum, ingredient) => {
    const item = itemsById.get(ingredient.itemId);
    if (!item) return sum;
    return sum + computeIngredientLineCost(ingredient, item);
  }, 0);
}

export function computeTotalCost(
  totalIngredientCost: number,
  miscCost: number,
): number {
  return totalIngredientCost + miscCost;
}

export function computeSalesProfit(
  salesPrice: number,
  totalCost: number,
): number {
  return salesPrice - totalCost;
}

export function computeCostPercent(
  salesPrice: number,
  totalCost: number,
): number | null {
  if (salesPrice <= 0) return null;
  return (totalCost / salesPrice) * 100;
}

export function computeServingsPerBatch(
  yieldQuantity: number,
  servingSize: number,
): number | null {
  if (
    !Number.isFinite(yieldQuantity) ||
    !Number.isFinite(servingSize) ||
    yieldQuantity <= 0 ||
    servingSize <= 0
  ) {
    return null;
  }
  return yieldQuantity / servingSize;
}

export function computeCostPerServing(
  totalCost: number,
  servingsPerBatch: number | null,
): number | null {
  if (servingsPerBatch === null || servingsPerBatch <= 0) return null;
  return totalCost / servingsPerBatch;
}

export function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = parseFloat(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}
