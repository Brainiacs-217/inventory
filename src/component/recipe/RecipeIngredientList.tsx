"use client";

import { Trash2 } from "lucide-react";

import { recipeInputClassName } from "@/component/recipe/formShared";
import { formatCurrency } from "@/lib/formatCurrency";
import {
  computeIngredientLineCost,
} from "@/lib/recipes/cost";
import type { InventoryItem } from "@/types/item";
import type { RecipeIngredientInput } from "@/types/recipe";

type RecipeIngredientListProps = {
  ingredients: RecipeIngredientInput[];
  catalogItems: InventoryItem[];
  onUpdate: (
    id: string,
    patch: Partial<Pick<RecipeIngredientInput, "quantity" | "unit">>,
  ) => void;
  onRemove: (id: string) => void;
};

export function RecipeIngredientList({
  ingredients,
  catalogItems,
  onUpdate,
  onRemove,
}: RecipeIngredientListProps) {
  const itemsById = new Map(catalogItems.map((item) => [item.id, item]));

  if (ingredients.length === 0) {
    return (
      <p className="mt-auto rounded-sm border border-dashed border-border/80 px-3 py-6 text-center text-xs text-text-muted">
        No ingredients yet — pick an item above and click Add.
      </p>
    );
  }

  return (
    <ul className="mt-auto max-h-32 divide-y divide-border/60 overflow-y-auto rounded-sm border border-border/80">
      {ingredients.map((ingredient) => {
        const item = itemsById.get(ingredient.itemId);
        if (!item) return null;

        const lineCost = computeIngredientLineCost(ingredient, item);

        return (
          <li
            key={ingredient.id}
            className="flex items-center gap-2 px-2.5 py-1.5 text-sm"
          >
            <span className="min-w-0 flex-1 truncate font-medium text-text-primary">
              {item.name}
            </span>
            <input
              type="number"
              min="0"
              step="any"
              value={ingredient.quantity}
              onChange={(event) =>
                onUpdate(ingredient.id, { quantity: event.target.value })
              }
              className={`${recipeInputClassName} w-16 px-2 py-0.5 text-xs`}
              aria-label={`Amount for ${item.name}`}
            />
            <span className="w-16 shrink-0 truncate text-xs text-text-muted">
              {ingredient.unit}
            </span>
            <span className="w-14 shrink-0 text-right tabular-nums text-xs font-medium text-text-primary">
              {formatCurrency(lineCost)}
            </span>
            <button
              type="button"
              onClick={() => onRemove(ingredient.id)}
              aria-label={`Remove ${item.name}`}
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
