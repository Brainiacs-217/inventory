"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";

import {
  RecipeField,
  RecipeSelectInput,
  recipeInputClassName,
  recipeSelectClassName,
} from "@/component/recipe/formShared";
import type { InventoryItem } from "@/types/item";
import {
  createRecipeIngredientInput,
  type BatchOption,
  type RecipeIngredientSource,
  type UnitOption,
} from "@/types/recipe";

type IngredientSearchProps = {
  catalogItems: InventoryItem[];
  batches: BatchOption[];
  units: UnitOption[];
  onAdd: (ingredient: ReturnType<typeof createRecipeIngredientInput>) => void;
};

const SOURCE_OPTIONS: { id: RecipeIngredientSource; label: string }[] = [
  { id: "item", label: "Item" },
  { id: "batch", label: "Batch" },
];

const MEASUREMENT_LABELS: Record<UnitOption["measurementType"], string> = {
  volume: "Volume",
  mass: "Mass",
  count: "Count",
};

function groupedUnits(units: UnitOption[]) {
  return (["volume", "mass", "count"] as const)
    .map((type) => ({
      type,
      label: MEASUREMENT_LABELS[type],
      units: units.filter((unit) => unit.measurementType === type),
    }))
    .filter((group) => group.units.length > 0);
}

export function IngredientSearch({
  catalogItems,
  batches,
  units,
  onAdd,
}: IngredientSearchProps) {
  const [source, setSource] = useState<RecipeIngredientSource>("item");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [amount, setAmount] = useState("");
  const [unitId, setUnitId] = useState(units[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);

  const unitGroups = useMemo(() => groupedUnits(units), [units]);
  const hasSource = source === "item" ? Boolean(selectedItemId) : Boolean(selectedBatchId);

  function handleSourceChange(next: RecipeIngredientSource) {
    setSource(next);
    setError(null);
  }

  function handleAdd() {
    if (source === "item" && !selectedItemId) {
      setError("Pick an item first.");
      return;
    }
    if (source === "batch" && !selectedBatchId) {
      setError("Pick a batch first.");
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
      createRecipeIngredientInput({
        source,
        itemId: selectedItemId,
        batchId: selectedBatchId,
        quantity: amount,
        unitId,
      }),
    );
    setSelectedItemId("");
    setSelectedBatchId("");
    setAmount("");
    setError(null);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="inline-flex w-full rounded-md border border-border/80 bg-surface p-0.5 md:w-fit">
        {SOURCE_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => handleSourceChange(option.id)}
            className={`min-h-11 flex-1 rounded-sm px-2.5 py-2 text-sm font-medium transition-colors md:min-h-0 md:flex-none md:py-1 md:text-xs ${
              source === option.id
                ? "bg-sidebar-active text-text-primary shadow-sm"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 items-end gap-3 md:grid-cols-[minmax(0,1.3fr)_minmax(0,0.55fr)_minmax(0,0.85fr)_auto] md:gap-x-3 md:gap-y-2.5">
        <RecipeField
          label={source === "item" ? "Item" : "Batch"}
          className="col-span-2 md:col-span-1"
        >
          <RecipeSelectInput>
            {source === "item" ? (
              <select
                value={selectedItemId}
                onChange={(event) => {
                  setSelectedItemId(event.target.value);
                  setError(null);
                }}
                className={recipeSelectClassName}
              >
                <option value="">Choose item…</option>
                {catalogItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={selectedBatchId}
                onChange={(event) => {
                  setSelectedBatchId(event.target.value);
                  setError(null);
                }}
                className={recipeSelectClassName}
              >
                <option value="">
                  {batches.length === 0 ? "No batches yet" : "Choose batch…"}
                </option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.name}
                  </option>
                ))}
              </select>
            )}
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
            disabled={!hasSource}
            className={recipeInputClassName}
          />
        </RecipeField>
        <RecipeField label="Unit">
          <RecipeSelectInput>
            <select
              value={unitId}
              onChange={(event) => setUnitId(event.target.value)}
              disabled={!hasSource}
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
