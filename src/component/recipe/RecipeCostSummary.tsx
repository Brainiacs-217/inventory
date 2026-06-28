"use client";

import {
  RecipeField,
  recipeFieldGridClassName,
  recipeInputClassName,
} from "@/component/recipe/formShared";
import {
  computeCostPercent,
  computeSalesProfit,
  computeTotalCost,
  formatCurrency,
  formatPercent,
} from "@/lib/recipeCost";

export type RecipeCostValues = {
  salesPrice: string;
  miscCost: string;
};

type RecipeCostSummaryProps = {
  values: RecipeCostValues;
  totalIngredientCost: number;
  errors: Partial<Record<keyof RecipeCostValues, string>>;
  onChange: <K extends keyof RecipeCostValues>(
    key: K,
    value: RecipeCostValues[K],
  ) => void;
};

export function RecipeCostSummary({
  values,
  totalIngredientCost,
  errors,
  onChange,
}: RecipeCostSummaryProps) {
  const miscCost = parseFloat(values.miscCost) || 0;
  const salesPrice = parseFloat(values.salesPrice) || 0;
  const totalCost = computeTotalCost(totalIngredientCost, miscCost);
  const salesProfit = computeSalesProfit(salesPrice, totalCost);
  const costPercent = computeCostPercent(salesPrice, totalCost);

  return (
    <div className="flex h-full flex-col gap-2.5">
      <div className={recipeFieldGridClassName}>
        <RecipeField label="Menu price" error={errors.salesPrice}>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-text-muted">
              $
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={values.salesPrice}
              onChange={(event) => onChange("salesPrice", event.target.value)}
              className={`${recipeInputClassName} pl-6`}
            />
          </div>
        </RecipeField>
        <RecipeField
          label="Other costs"
          error={errors.miscCost}
          hint="Labor, packaging, etc."
        >
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-text-muted">
              $
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={values.miscCost}
              onChange={(event) => onChange("miscCost", event.target.value)}
              className={`${recipeInputClassName} pl-6`}
            />
          </div>
        </RecipeField>
      </div>
      <dl className="mt-auto grid grid-cols-2 gap-x-3 gap-y-2 border-t border-border/60 pt-2.5 text-xs">
        <div className="flex justify-between gap-2">
          <dt className="text-text-muted">Food cost</dt>
          <dd className="tabular-nums font-medium text-text-primary">
            {formatCurrency(totalIngredientCost)}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-text-muted">Total cost</dt>
          <dd className="tabular-nums font-semibold text-text-primary">
            {formatCurrency(totalCost)}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-text-muted">Profit</dt>
          <dd className="tabular-nums font-medium text-text-primary">
            {formatCurrency(salesProfit)}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-text-muted">Cost %</dt>
          <dd className="tabular-nums font-medium text-text-primary">
            {costPercent !== null ? formatPercent(costPercent) : "—"}
          </dd>
        </div>
      </dl>
    </div>
  );
}
