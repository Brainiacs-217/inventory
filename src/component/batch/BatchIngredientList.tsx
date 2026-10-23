"use client";

import { Trash2 } from "lucide-react";
import type { ReactNode } from "react";

import {
  RecipeSelectInput,
  recipeInputClassName,
  recipeSelectClassName,
} from "@/component/recipe/formShared";
import type { BatchIngredientInput } from "@/types/batch";
import type { InventoryItem } from "@/types/item";
import type { UnitOption } from "@/types/recipe";

type BatchIngredientListProps = {
  ingredients: BatchIngredientInput[];
  catalogItems: InventoryItem[];
  units: UnitOption[];
  onUpdate: (
    id: string,
    patch: Partial<Pick<BatchIngredientInput, "quantity" | "unitId">>,
  ) => void;
  onRemove: (id: string) => void;
};

export function BatchIngredientList({
  ingredients,
  catalogItems,
  units,
  onUpdate,
  onRemove,
}: BatchIngredientListProps) {
  const itemsById = new Map(catalogItems.map((item) => [item.id, item]));

  if (ingredients.length === 0) {
    return (
      <p className="rounded-sm border border-dashed border-border/80 px-3 py-6 text-center text-xs text-text-muted md:mt-auto">
        No lines yet — add an item above.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border/60 overflow-y-auto rounded-sm border border-border/80 md:mt-auto md:max-h-56">
      {ingredients.map((ingredient) => {
        const itemName = itemsById.get(ingredient.itemId)?.name;
        if (!itemName) return null;

        return (
          <li key={ingredient.id} className="text-sm">
            <div className="flex flex-col gap-2.5 px-3 py-3 md:hidden">
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 truncate font-medium text-text-primary">{itemName}</p>
                <RemoveButton name={itemName} onClick={() => onRemove(ingredient.id)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <LineField label="Quantity">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={ingredient.quantity}
                    onChange={(event) =>
                      onUpdate(ingredient.id, { quantity: event.target.value })
                    }
                    className={recipeInputClassName}
                    aria-label={`Quantity for ${itemName}`}
                  />
                </LineField>
                <LineField label="Unit">
                  <RecipeSelectInput>
                    <select
                      value={ingredient.unitId}
                      onChange={(event) =>
                        onUpdate(ingredient.id, { unitId: event.target.value })
                      }
                      className={recipeSelectClassName}
                      aria-label={`Unit for ${itemName}`}
                    >
                      {units.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.symbol}
                        </option>
                      ))}
                    </select>
                  </RecipeSelectInput>
                </LineField>
              </div>
            </div>

            <div className="hidden grid-cols-[minmax(0,1.4fr)_5.5rem_8rem_1.75rem] items-center gap-2 px-2.5 py-1.5 md:grid">
              <p className="min-w-0 truncate font-medium text-text-primary">{itemName}</p>
              <input
                type="number"
                min="0"
                step="any"
                value={ingredient.quantity}
                onChange={(event) =>
                  onUpdate(ingredient.id, { quantity: event.target.value })
                }
                className={`${recipeInputClassName} px-2 py-0.5 text-xs`}
                aria-label={`Quantity for ${itemName}`}
              />
              <RecipeSelectInput>
                <select
                  value={ingredient.unitId}
                  onChange={(event) =>
                    onUpdate(ingredient.id, { unitId: event.target.value })
                  }
                  className={`${recipeSelectClassName} py-0.5 text-xs`}
                  aria-label={`Unit for ${itemName}`}
                >
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.symbol}
                    </option>
                  ))}
                </select>
              </RecipeSelectInput>
              <RemoveButton name={itemName} onClick={() => onRemove(ingredient.id)} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function LineField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

function RemoveButton({ name, onClick }: { name: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Remove ${name}`}
      className="inline-flex size-11 shrink-0 items-center justify-center rounded-sm text-text-muted transition-colors hover:bg-error/5 hover:text-error md:size-6"
    >
      <Trash2 className="size-4 md:size-3.5" strokeWidth={2} aria-hidden />
    </button>
  );
}
