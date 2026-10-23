"use client";

import { Trash2 } from "lucide-react";
import type { ReactNode } from "react";

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
      <p className="rounded-sm border border-dashed border-border/80 px-3 py-6 text-center text-xs text-text-muted md:mt-auto">
        No lines yet — add an item or a batch above.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border/60 overflow-y-auto rounded-sm border border-border/80 md:mt-auto md:max-h-56">
      {ingredients.map((ingredient) => {
        const sourceName =
          ingredient.source === "item"
            ? itemsById.get(ingredient.itemId ?? "")?.name
            : batchesById.get(ingredient.batchId ?? "")?.name;
        if (!sourceName) return null;

        return (
          <li key={ingredient.id} className="text-sm">
            <div className="flex flex-col gap-2.5 px-3 py-3 md:hidden">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-text-primary">{sourceName}</p>
                  <p className="truncate text-[10px] uppercase tracking-wide text-text-muted">
                    {ingredient.source === "item" ? "Item" : "Batch"}
                  </p>
                </div>
                <RemoveButton name={sourceName} onClick={() => onRemove(ingredient.id)} />
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
                    aria-label={`Quantity for ${sourceName}`}
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
                      aria-label={`Unit for ${sourceName}`}
                    >
                      {units.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.symbol}
                        </option>
                      ))}
                    </select>
                  </RecipeSelectInput>
                </LineField>
                <LineField label="Role">
                  <RecipeSelectInput>
                    <select
                      value={ingredient.role}
                      onChange={(event) =>
                        onUpdate(ingredient.id, {
                          role: event.target.value as RecipeIngredientRole,
                        })
                      }
                      className={recipeSelectClassName}
                      aria-label={`Role for ${sourceName}`}
                    >
                      {ROLE_OPTIONS.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </RecipeSelectInput>
                </LineField>
                <LineField label="Note">
                  <input
                    type="text"
                    value={ingredient.note}
                    onChange={(event) =>
                      onUpdate(ingredient.id, { note: event.target.value })
                    }
                    placeholder="Optional"
                    className={recipeInputClassName}
                    aria-label={`Note for ${sourceName}`}
                  />
                </LineField>
              </div>
            </div>

            <div className="hidden grid-cols-[minmax(0,1.2fr)_4.5rem_6.5rem_7rem_minmax(0,1fr)_1.75rem] items-center gap-2 px-2.5 py-1.5 md:grid">
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
              <RemoveButton name={sourceName} onClick={() => onRemove(ingredient.id)} />
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
