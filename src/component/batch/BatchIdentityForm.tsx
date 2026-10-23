"use client";

import { useMemo } from "react";

import {
  RecipeField,
  RecipeSelectInput,
  recipeFieldGridClassName,
  recipeInputClassName,
  recipeSelectClassName,
} from "@/component/recipe/formShared";
import type { UnitOption } from "@/types/recipe";

type BatchIdentityFormProps = {
  name: string;
  yieldQuantity: string;
  yieldUnitId: string;
  units: UnitOption[];
  errors: Partial<Record<"name" | "yieldQuantity" | "yieldUnitId", string>>;
  onNameChange: (name: string) => void;
  onYieldQuantityChange: (value: string) => void;
  onYieldUnitChange: (unitId: string) => void;
};

const MEASUREMENT_LABELS: Record<UnitOption["measurementType"], string> = {
  volume: "Volume",
  mass: "Mass",
  count: "Count",
};

export function BatchIdentityForm({
  name,
  yieldQuantity,
  yieldUnitId,
  units,
  errors,
  onNameChange,
  onYieldQuantityChange,
  onYieldUnitChange,
}: BatchIdentityFormProps) {
  const unitGroups = useMemo(
    () =>
      (["volume", "mass", "count"] as const)
        .map((type) => ({
          type,
          label: MEASUREMENT_LABELS[type],
          units: units.filter((unit) => unit.measurementType === type),
        }))
        .filter((group) => group.units.length > 0),
    [units],
  );

  return (
    <div className="flex flex-col gap-2.5">
      <RecipeField id="batch-name" label="Batch name" required error={errors.name}>
        <input
          type="text"
          placeholder="e.g. House syrup"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          className={recipeInputClassName}
        />
      </RecipeField>
      <div id="batch-yield" className={recipeFieldGridClassName}>
        <RecipeField label="Yield" required error={errors.yieldQuantity}>
          <input
            type="number"
            min="0"
            step="any"
            placeholder="e.g. 5"
            value={yieldQuantity}
            onChange={(event) => onYieldQuantityChange(event.target.value)}
            className={recipeInputClassName}
          />
        </RecipeField>
        <RecipeField label="Unit" required error={errors.yieldUnitId}>
          <RecipeSelectInput>
            <select
              value={yieldUnitId}
              onChange={(event) => onYieldUnitChange(event.target.value)}
              className={recipeSelectClassName}
            >
              <option value="">Choose unit…</option>
              {unitGroups.map((group) => (
                <optgroup key={group.type} label={group.label}>
                  {group.units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.symbol} · {unit.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </RecipeSelectInput>
        </RecipeField>
      </div>
    </div>
  );
}
