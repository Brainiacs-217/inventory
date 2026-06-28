"use client";

import {
  RecipeField,
  RecipeSelectInput,
  recipeFieldGridClassName,
  recipeInputClassName,
  recipeSelectClassName,
} from "@/component/recipe/formShared";
import { UNITS_OF_MEASURE } from "@/lib/lookups";
import {
  computeCostPerServing,
  computeServingsPerBatch,
  formatCurrency,
  parseOptionalNumber,
} from "@/lib/recipeCost";

export type YieldServingValues = {
  yieldQuantity: string;
  yieldUnit: string;
  servingSizeQuantity: string;
  servingSizeUnit: string;
};

type YieldServingOptionsProps = {
  values: YieldServingValues;
  totalCost: number;
  errors: Partial<Record<keyof YieldServingValues, string>>;
  onChange: <K extends keyof YieldServingValues>(
    key: K,
    value: YieldServingValues[K],
  ) => void;
};

export function YieldServingOptions({
  values,
  totalCost,
  errors,
  onChange,
}: YieldServingOptionsProps) {
  const yieldQuantity = parseOptionalNumber(values.yieldQuantity);
  const servingSize = parseOptionalNumber(values.servingSizeQuantity);
  const servingsPerBatch = computeServingsPerBatch(
    yieldQuantity ?? NaN,
    servingSize ?? NaN,
  );
  const costPerServing = computeCostPerServing(totalCost, servingsPerBatch);

  return (
    <div className="flex h-full flex-col gap-2.5">
      <div className={recipeFieldGridClassName}>
        <RecipeField label="Recipe makes" error={errors.yieldQuantity}>
          <input
            type="number"
            min="0"
            step="any"
            placeholder="Optional"
            value={values.yieldQuantity}
            onChange={(event) => onChange("yieldQuantity", event.target.value)}
            className={recipeInputClassName}
          />
        </RecipeField>
        <RecipeField label="Unit" error={errors.yieldUnit}>
          <RecipeSelectInput>
            <select
              value={values.yieldUnit}
              onChange={(event) => onChange("yieldUnit", event.target.value)}
              className={recipeSelectClassName}
            >
              <option value="">—</option>
              {UNITS_OF_MEASURE.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </RecipeSelectInput>
        </RecipeField>
        <RecipeField label="Per serving" error={errors.servingSizeQuantity}>
          <input
            type="number"
            min="0"
            step="any"
            placeholder="Optional"
            value={values.servingSizeQuantity}
            onChange={(event) =>
              onChange("servingSizeQuantity", event.target.value)
            }
            className={recipeInputClassName}
          />
        </RecipeField>
        <RecipeField label="Unit" error={errors.servingSizeUnit}>
          <RecipeSelectInput>
            <select
              value={values.servingSizeUnit}
              onChange={(event) =>
                onChange("servingSizeUnit", event.target.value)
              }
              className={recipeSelectClassName}
            >
              <option value="">—</option>
              {UNITS_OF_MEASURE.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </RecipeSelectInput>
        </RecipeField>
      </div>
      {servingsPerBatch !== null ? (
        <p className="mt-auto border-t border-border/60 pt-2.5 text-xs text-text-muted">
          <span className="tabular-nums font-medium text-text-secondary">
            {servingsPerBatch.toFixed(1)} servings
          </span>
          {costPerServing !== null ? (
            <>
              {" "}
              ·{" "}
              <span className="tabular-nums font-medium text-text-secondary">
                {formatCurrency(costPerServing)} each
              </span>
            </>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
