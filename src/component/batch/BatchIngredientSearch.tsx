"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";

import {
  RecipeField,
  RecipeSelectInput,
  recipeInputClassName,
  recipeSelectClassName,
} from "@/component/recipe/formShared";
import { createBatchIngredientInput } from "@/types/batch";
import type { InventoryItem } from "@/types/item";
import type { UnitOption } from "@/types/recipe";

type BatchIngredientSearchProps = {
  catalogItems: InventoryItem[];
  units: UnitOption[];
  onAdd: (ingredient: ReturnType<typeof createBatchIngredientInput>) => void;
};

const MEASUREMENT_LABELS: Record<UnitOption["measurementType"], string> = {
  volume: "Volume",
  mass: "Mass",
  count: "Count",
};

export function BatchIngredientSearch({
  catalogItems,
  units,
  onAdd,
}: BatchIngredientSearchProps) {
  const [selectedItemId, setSelectedItemId] = useState("");
  const [amount, setAmount] = useState("");
  const [unitId, setUnitId] = useState(units[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);

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

  function handleAdd() {
    if (!selectedItemId) {
      setError("Pick an item first.");
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (!amount.trim() || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Enter an amount greater than 0.");
      return;
    }
    if (!unitId) {
      setError("Pick a unit.");
      return;
    }

    onAdd(
      createBatchIngredientInput({
        itemId: selectedItemId,
        quantity: amount,
        unitId,
      }),
    );
    setSelectedItemId("");
    setAmount("");
    setError(null);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 items-end gap-3 md:grid-cols-[minmax(0,1.3fr)_minmax(0,0.55fr)_minmax(0,0.85fr)_auto] md:gap-x-3 md:gap-y-2.5">
        <RecipeField label="Item" className="col-span-2 md:col-span-1">
          <RecipeSelectInput>
            <select
              value={selectedItemId}
              onChange={(event) => {
                setSelectedItemId(event.target.value);
                setError(null);
              }}
              className={recipeSelectClassName}
            >
              <option value="">
                {catalogItems.length === 0 ? "No items yet" : "Choose item…"}
              </option>
              {catalogItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </RecipeSelectInput>
        </RecipeField>
        <RecipeField label="Quantity">
          <input
            type="number"
            min="0"
            step="any"
            placeholder="0"
            value={amount}
            onChange={(event) => {
              setAmount(event.target.value);
              setError(null);
            }}
            disabled={!selectedItemId}
            className={recipeInputClassName}
          />
        </RecipeField>
        <RecipeField label="Unit">
          <RecipeSelectInput>
            <select
              value={unitId}
              onChange={(event) => setUnitId(event.target.value)}
              disabled={!selectedItemId}
              className={recipeSelectClassName}
            >
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
        <div className="col-span-2 flex items-end md:col-span-1">
          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-sm bg-accent px-3 py-2.5 text-sm font-medium text-text-primary shadow-sm transition-colors hover:bg-accent-hover md:min-h-0 md:py-1.5"
          >
            <Plus className="size-3.5" strokeWidth={2} aria-hidden />
            Add
          </button>
        </div>
      </div>
      {error ? <p className="text-xs text-error">{error}</p> : null}
    </div>
  );
}
