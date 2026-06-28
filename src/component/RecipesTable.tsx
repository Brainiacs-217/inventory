"use client";

import { BookOpen, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { CreateRecipeModal } from "@/component/CreateRecipeModal";
import { Modal } from "@/component/Modal";
import { CHART_ICON_BADGE_CLASS } from "@/lib/chartInteraction";
import {
  computeTotalCost,
  computeTotalIngredientCost,
  parseOptionalNumber,
} from "@/lib/recipeCost";
import type { InventoryItem } from "@/types/item";
import {
  type CreateRecipeFormValues,
  type Recipe,
} from "@/types/recipe";

const SELECT_CELL_CLASS = "w-11 px-3 py-3 text-center align-middle";

function formatRecipeCount(count: number): string {
  return count === 1 ? "1 recipe" : `${count} recipes`;
}

function formatYield(
  yieldQuantity: number | null,
  yieldUnit: string | null,
): string {
  if (yieldQuantity === null) return "—";
  const unit = yieldUnit?.trim();
  return unit ? `${yieldQuantity} ${unit}` : `${yieldQuantity}`;
}

function mapFormToRecipe(
  values: CreateRecipeFormValues,
  itemsById: Map<string, InventoryItem>,
): Recipe {
  const totalIngredientCost = computeTotalIngredientCost(
    values.ingredients,
    itemsById,
  );
  const miscCost = parseFloat(values.miscCost) || 0;
  const totalCost = computeTotalCost(totalIngredientCost, miscCost);
  const salesPrice = parseFloat(values.salesPrice) || 0;

  return {
    id: crypto.randomUUID(),
    name: values.name.trim(),
    yieldQuantity: parseOptionalNumber(values.yieldQuantity),
    yieldUnit: values.yieldUnit.trim() || null,
    servingSizeQuantity: parseOptionalNumber(values.servingSizeQuantity),
    servingSizeUnit: values.servingSizeUnit.trim() || null,
    salesPrice,
    miscCost,
    foodCost: totalCost,
    menuPrice: salesPrice,
    ingredientCount: values.ingredients.length,
  };
}

type RecipesTableProps = {
  recipes?: Recipe[];
  catalogItems?: InventoryItem[];
};

export function RecipesTable({
  recipes: initialRecipes = [],
  catalogItems = [],
}: RecipesTableProps) {
  const [recipes, setRecipes] = useState(initialRecipes);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const itemsById = useMemo(
    () => new Map(catalogItems.map((item) => [item.id, item])),
    [catalogItems],
  );

  const allSelected = recipes.length > 0 && selectedIds.size === recipes.length;
  const someSelected = selectedIds.size > 0;
  const selectedCount = selectedIds.size;

  function handleSave(values: CreateRecipeFormValues) {
    setRecipes((current) => [...current, mapFormToRecipe(values, itemsById)]);
  }

  function toggleSelection(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds(
      allSelected ? new Set() : new Set(recipes.map((recipe) => recipe.id)),
    );
  }

  function handleDeleteClick() {
    if (!someSelected) return;
    setDeleteConfirmOpen(true);
  }

  function handleDeleteConfirm() {
    setRecipes((current) =>
      current.filter((recipe) => !selectedIds.has(recipe.id)),
    );
    setSelectedIds(new Set());
    setDeleteConfirmOpen(false);
  }

  return (
    <>
      <div className="w-full overflow-hidden rounded-xl border border-border/80 bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-4px_rgba(0,0,0,0.08)]">
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border/80 bg-surface px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className={CHART_ICON_BADGE_CLASS}>
              <BookOpen className="size-4 text-text-muted" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight text-text-primary">
                {formatRecipeCount(recipes.length)}
              </p>
              <p className="text-xs text-text-muted">In your catalog</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDeleteClick}
              disabled={!someSelected}
              className="inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-surface px-4 py-2 text-sm font-medium text-text-secondary shadow-sm transition-colors hover:border-error/30 hover:bg-error/5 hover:text-error disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border/80 disabled:hover:bg-surface disabled:hover:text-text-secondary"
            >
              <Trash2 className="size-4" strokeWidth={2} />
              Delete
            </button>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-text-primary shadow-sm transition-[background-color,box-shadow] hover:bg-accent-hover hover:shadow"
            >
              <Plus className="size-4" strokeWidth={2} />
              Add recipe
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-fixed border-collapse text-sm">
            <colgroup>
              <col className="w-11" />
              <col className="w-[24%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[12%]" />
              <col className="w-[14%]" />
            </colgroup>
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-border/80 bg-surface-muted/80 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted backdrop-blur-sm">
                <th className={SELECT_CELL_CLASS}>
                  <input
                    type="checkbox"
                    aria-label="Select all recipes"
                    checked={allSelected}
                    ref={(input) => {
                      if (input) {
                        input.indeterminate = someSelected && !allSelected;
                      }
                    }}
                    onChange={toggleSelectAll}
                    className="size-4 rounded border-border/80 accent-accent"
                  />
                </th>
                <th className="px-3 py-3">Name</th>
                <th className="px-3 py-3">Yield</th>
                <th className="px-3 py-3">Food Cost</th>
                <th className="px-3 py-3">Menu Price</th>
                <th className="px-3 py-3">Ingredients</th>
                <th className="px-3 py-3">Cost %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {recipes.map((recipe) => {
                const costPercent =
                  recipe.menuPrice > 0
                    ? (recipe.foodCost / recipe.menuPrice) * 100
                    : null;

                return (
                  <tr
                    key={recipe.id}
                    className="group bg-surface transition-colors hover:bg-surface-muted/40"
                  >
                    <td className={SELECT_CELL_CLASS}>
                      <input
                        type="checkbox"
                        aria-label={`Select ${recipe.name}`}
                        checked={selectedIds.has(recipe.id)}
                        onChange={() => toggleSelection(recipe.id)}
                        className="size-4 rounded border-border/80 accent-accent transition-shadow group-hover:shadow-sm"
                      />
                    </td>
                    <td className="px-3 py-3 align-middle">
                      <span
                        className="block truncate font-medium text-text-primary"
                        title={recipe.name}
                      >
                        {recipe.name}
                      </span>
                    </td>
                    <td className="px-3 py-3 align-middle">
                      <span
                        className="block truncate text-text-secondary"
                        title={formatYield(recipe.yieldQuantity, recipe.yieldUnit)}
                      >
                        {formatYield(recipe.yieldQuantity, recipe.yieldUnit)}
                      </span>
                    </td>
                    <td className="px-3 py-3 align-middle">
                      <span className="tabular-nums font-medium text-text-primary">
                        ${recipe.foodCost.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-3 py-3 align-middle">
                      <span className="tabular-nums font-medium text-text-primary">
                        ${recipe.menuPrice.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-3 py-3 align-middle">
                      <span className="text-text-secondary">
                        {recipe.ingredientCount}
                      </span>
                    </td>
                    <td className="px-3 py-3 align-middle">
                      <span className="tabular-nums text-text-secondary">
                        {costPercent !== null ? `${costPercent.toFixed(1)}%` : "—"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <CreateRecipeModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSave={handleSave}
        catalogItems={catalogItems}
      />

      <Modal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Delete recipes"
        footer={
          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setDeleteConfirmOpen(false)}
              className="rounded-md border border-border/80 bg-surface px-3.5 py-1.5 text-sm font-medium text-text-secondary shadow-sm transition-colors hover:border-text-muted/30 hover:text-text-primary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              className="rounded-md bg-error px-3.5 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-error/90"
            >
              Delete
            </button>
          </div>
        }
      >
        <p className="text-sm text-text-secondary">
          {allSelected
            ? "Are you sure you want to delete all recipes?"
            : `Are you sure you want to delete ${selectedCount} selected ${selectedCount === 1 ? "recipe" : "recipes"}?`}
        </p>
      </Modal>
    </>
  );
}
