"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import {
  RecipeField,
  RecipeSelectInput,
  recipeInputClassName,
  recipeSelectClassName,
} from "@/component/recipe/formShared";
import { UNITS_OF_MEASURE } from "@/lib/lookups";
import type { InventoryItem } from "@/types/item";
import { createRecipeIngredientInput } from "@/types/recipe";

type IngredientSearchProps = {
  catalogItems: InventoryItem[];
  onAdd: (ingredient: ReturnType<typeof createRecipeIngredientInput>) => void;
};

function unitOptionsForItem(item: InventoryItem): string[] {
  return [...new Set([item.reportingUnit, ...UNITS_OF_MEASURE])];
}

export function IngredientSearch({ catalogItems, onAdd }: IngredientSearchProps) {
  const [selectedItemId, setSelectedItemId] = useState("");
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState("");
  const [error, setError] = useState<string | null>(null);

  const selectedItem = catalogItems.find((item) => item.id === selectedItemId);
  const availableUnits = selectedItem ? unitOptionsForItem(selectedItem) : [];

  function handleItemChange(itemId: string) {
    const item = catalogItems.find((entry) => entry.id === itemId);
    setSelectedItemId(itemId);
    setUnit(item?.reportingUnit ?? "");
    setError(null);
  }

  function handleAdd() {
    if (!selectedItem) {
      setError("Pick an item first.");
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (!amount.trim() || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Enter an amount.");
      return;
    }

    onAdd({
      ...createRecipeIngredientInput(selectedItem.id, unit || selectedItem.reportingUnit),
      quantity: amount,
    });
    setSelectedItemId("");
    setAmount("");
    setUnit("");
    setError(null);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-[1.2fr_0.65fr_0.85fr_auto] items-end gap-x-3 gap-y-2.5">
        <RecipeField label="Item" className="sm:col-span-1">
          <RecipeSelectInput>
            <select
              value={selectedItemId}
              onChange={(event) => handleItemChange(event.target.value)}
              className={recipeSelectClassName}
            >
              <option value="">Choose item…</option>
              {catalogItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </RecipeSelectInput>
        </RecipeField>
        <RecipeField label="Amount">
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
            disabled={!selectedItem}
            className={recipeInputClassName}
          />
        </RecipeField>
        <RecipeField label="Unit">
          <RecipeSelectInput>
            <select
              value={unit}
              onChange={(event) => setUnit(event.target.value)}
              disabled={!selectedItem}
              className={recipeSelectClassName}
            >
              {availableUnits.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </RecipeSelectInput>
        </RecipeField>
        <div className="flex items-end">
          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex w-full items-center justify-center gap-1 rounded-sm bg-accent px-3 py-1 text-sm font-medium text-text-primary shadow-sm transition-colors hover:bg-accent-hover"
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
