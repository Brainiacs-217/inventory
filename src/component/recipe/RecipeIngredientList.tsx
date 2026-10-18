"use client";

import { Trash2 } from "lucide-react";

import {
  RecipeSelectInput,
  recipeInputClassName,
  recipeSelectClassName,
} from "@/component/recipe/formShared";
import type { InventoryItem } from "@/types/item";
import type {
  BatchOption,
  RecipeIngredientInput,
  RecipeIngredientRole,
  UnitOption,
} from "@/types/recipe";

type RecipeIngredientListProps = {
  ingredients: RecipeIngredientInput[];
  catalogItems: InventoryItem[];
  batches: BatchOption[];
  units: UnitOption[];
  onUpdate: (
    id: string,
    patch: Partial<Pick<RecipeIngredientInput, "quantity" | "unitId" | "role" | "note">>,
  ) => void;
  onRemove: (id: string) => void;
};

const ROLE_OPTIONS: { id: RecipeIngredientRole; label: string }[] = [
  { id: "ingredient", label: "Ingredient" },
  { id: "garnish", label: "Garnish" },
];

export function RecipeIngredientList({
  ingredients,
  catalogItems,
  batches,
  units,
  onUpdate,
  onRemove,
}: RecipeIngredientListProps) {
  const itemsById = new Map(catalogItems.map((item) => [item.id, item]));
  const batchesById = new Map(batches.map((batch) => [batch.id, batch]));

  if (ingredients.length === 0) {
    return (
      <p className="mt-auto rounded-sm border border-dashed border-border/80 px-3 py-6 text-center text-xs text-text-muted">
        No lines yet — add an item or a batch above.
      </p>
    );
  }

  return (
    <ul className="mt-auto max-h-56 divide-y divide-border/60 overflow-y-auto rounded-sm border border-border/80">
      {ingredients.map((ingredient) => {
        const sourceName =
          ingredient.source === "item"
            ? itemsById.get(ingredient.itemId ?? "")?.name
            : batchesById.get(ingredient.batchId ?? "")?.name;
        if (!sourceName) return null;

        return (
          <li
            key={ingredient.id}
            className="grid grid-cols-[minmax(0,1.2fr)_4.5rem_6.5rem_7rem_minmax(0,1fr)_1.75rem] items-center gap-2 px-2.5 py-1.5 text-sm"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-text-primary">{sourceName}</p>
              <p className="truncate text-[10px] uppercase tracking-wide text-text-muted">
                {ingredient.source === "item" ? "Item" : "Batch"}
              </p>
            </div>
            <input
              type="number"
              min="0"
              step="any"
              value={ingredient.quantity}
              onChange={(event) =>
                onUpdate(ingredient.id, { quantity: event.target.value })
              }
              className={`${recipeInputClassName} px-2 py-0.5 text-xs`}
              aria-label={`Quantity for ${sourceName}`}
            />
            <RecipeSelectInput>
              <select
                value={ingredient.unitId}
                onChange={(event) =>
                  onUpdate(ingredient.id, { unitId: event.target.value })
                }
                className={`${recipeSelectClassName} py-0.5 text-xs`}
                aria-label={`Unit for ${sourceName}`}
              >
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.symbol}
                  </option>
                ))}
              </select>
            </RecipeSelectInput>
            <RecipeSelectInput>
              <select
                value={ingredient.role}
                onChange={(event) =>
                  onUpdate(ingredient.id, {
                    role: event.target.value as RecipeIngredientRole,
                  })
                }
                className={`${recipeSelectClassName} py-0.5 text-xs`}
                aria-label={`Role for ${sourceName}`}
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </RecipeSelectInput>
            <input
              type="text"
              value={ingredient.note}
              onChange={(event) =>
                onUpdate(ingredient.id, { note: event.target.value })
              }
              placeholder="Note"
              className={`${recipeInputClassName} px-2 py-0.5 text-xs`}
              aria-label={`Note for ${sourceName}`}
            />
            <button
              type="button"
              onClick={() => onRemove(ingredient.id)}
              aria-label={`Remove ${sourceName}`}
              className="inline-flex size-6 shrink-0 items-center justify-center rounded-sm text-text-muted transition-colors hover:bg-error/5 hover:text-error"
            >
              <Trash2 className="size-3.5" strokeWidth={2} aria-hidden />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
