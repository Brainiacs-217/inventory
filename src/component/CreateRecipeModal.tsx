"use client";

import { useEffect, useMemo, useState } from "react";

import { IngredientSearch } from "@/component/recipe/IngredientSearch";
import { RecipeCostSummary } from "@/component/recipe/RecipeCostSummary";
import { RecipeIdentityForm } from "@/component/recipe/RecipeIdentityForm";
import { RecipeIngredientList } from "@/component/recipe/RecipeIngredientList";
import { YieldServingOptions } from "@/component/recipe/YieldServingOptions";
import {
  RecipeFormSection,
  recipeSectionRowClassName,
} from "@/component/recipe/formShared";
import { Modal } from "@/component/Modal";
import {
  computeTotalCost,
  computeTotalIngredientCost,
  parseOptionalNumber,
} from "@/lib/recipeCost";
import type { InventoryItem } from "@/types/item";
import {
  createEmptyRecipeFormValues,
  type CreateRecipeFormValues,
  type RecipeIngredientInput,
} from "@/types/recipe";

type CreateRecipeModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (values: CreateRecipeFormValues) => Promise<void>;
  catalogItems: InventoryItem[];
};

type FormErrors = Partial<
  Record<
    | keyof CreateRecipeFormValues
    | "ingredients"
    | "salesPrice"
    | "miscCost"
    | "yieldQuantity"
    | "servingSizeQuantity",
    string
  >
>;

function validateForm(values: CreateRecipeFormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.name.trim()) {
    errors.name = "Recipe name is required.";
  }

  if (values.ingredients.length === 0) {
    errors.ingredients = "Add at least one ingredient.";
  }

  for (const ingredient of values.ingredients) {
    const amount = parseFloat(ingredient.quantity);
    if (
      !ingredient.quantity.trim() ||
      Number.isNaN(amount) ||
      amount <= 0
    ) {
      errors.ingredients = "Each ingredient needs an amount.";
      break;
    }
  }

  if (values.salesPrice.trim()) {
    const salesPrice = parseFloat(values.salesPrice);
    if (Number.isNaN(salesPrice) || salesPrice < 0) {
      errors.salesPrice = "Enter a valid price.";
    }
  }

  if (values.miscCost.trim()) {
    const miscCost = parseFloat(values.miscCost);
    if (Number.isNaN(miscCost) || miscCost < 0) {
      errors.miscCost = "Enter a valid amount.";
    }
  }

  if (
    values.yieldQuantity.trim() &&
    parseOptionalNumber(values.yieldQuantity) === null
  ) {
    errors.yieldQuantity = "Enter a valid number.";
  }

  if (
    values.servingSizeQuantity.trim() &&
    parseOptionalNumber(values.servingSizeQuantity) === null
  ) {
    errors.servingSizeQuantity = "Enter a valid number.";
  }

  return errors;
}

export function CreateRecipeModal({
  open,
  onClose,
  onSave,
  catalogItems,
}: CreateRecipeModalProps) {
  const [values, setValues] = useState<CreateRecipeFormValues>(
    createEmptyRecipeFormValues(),
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues(createEmptyRecipeFormValues());
    setErrors({});
  }, [open]);

  const itemsById = useMemo(
    () => new Map(catalogItems.map((item) => [item.id, item])),
    [catalogItems],
  );

  const totalIngredientCost = useMemo(
    () => computeTotalIngredientCost(values.ingredients, itemsById),
    [values.ingredients, itemsById],
  );

  const miscCost = parseFloat(values.miscCost) || 0;
  const totalCost = computeTotalCost(totalIngredientCost, miscCost);

  function updateField<K extends keyof CreateRecipeFormValues>(
    key: K,
    value: CreateRecipeFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[key];
      if (key === "ingredients") delete next.ingredients;
      return next;
    });
  }

  function handleAddIngredient(ingredient: RecipeIngredientInput) {
    updateField("ingredients", [...values.ingredients, ingredient]);
  }

  function handleUpdateIngredient(
    id: string,
    patch: Partial<Pick<RecipeIngredientInput, "quantity" | "unit">>,
  ) {
    updateField(
      "ingredients",
      values.ingredients.map((ingredient) =>
        ingredient.id === id ? { ...ingredient, ...patch } : ingredient,
      ),
    );
  }

  function handleRemoveIngredient(id: string) {
    updateField(
      "ingredients",
      values.ingredients.filter((ingredient) => ingredient.id !== id),
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const validationErrors = validateForm(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    try {
      await onSave(values);
      onClose();
    } catch (error) {
      setErrors({
        name: error instanceof Error ? error.message : "Failed to save recipe.",
      });
    } finally {
      setSaving(false);
    }
  }

  const footer = (
    <div className="flex justify-end gap-2.5">
      <button
        type="button"
        onClick={onClose}
        className="rounded-sm border border-border/80 bg-surface px-3.5 py-1.5 text-sm font-medium text-text-secondary shadow-sm transition-colors hover:border-text-muted/30 hover:text-text-primary"
      >
        Cancel
      </button>
      <button
        type="submit"
        form="create-recipe-form"
        disabled={saving}
        className="rounded-sm bg-accent px-3.5 py-1.5 text-sm font-medium text-text-primary shadow-sm transition-colors hover:bg-accent-hover disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save recipe"}
      </button>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create recipe"
      footer={footer}
      size="xl"
      bodyClassName="overflow-hidden py-3"
    >
      <form
        id="create-recipe-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-3"
      >
        <div className={recipeSectionRowClassName}>
          <RecipeFormSection
            step="01"
            title="Identity"
            description="What is this recipe called?"
          >
            <RecipeIdentityForm
              name={values.name}
              error={errors.name}
              onChange={(name) => updateField("name", name)}
            />
          </RecipeFormSection>

          <RecipeFormSection
            step="02"
            title="Ingredients"
            description="Pick items from your catalog and how much goes in."
          >
            <div className="flex h-full flex-col gap-2.5">
              <IngredientSearch
                catalogItems={catalogItems}
                onAdd={handleAddIngredient}
              />
              <RecipeIngredientList
                ingredients={values.ingredients}
                catalogItems={catalogItems}
                onUpdate={handleUpdateIngredient}
                onRemove={handleRemoveIngredient}
              />
              {errors.ingredients ? (
                <p className="text-xs text-error">{errors.ingredients}</p>
              ) : null}
            </div>
          </RecipeFormSection>
        </div>

        <div className={recipeSectionRowClassName}>
          <RecipeFormSection
            step="03"
            title="Pricing"
            description="Menu price and other costs — totals compute automatically."
          >
            <RecipeCostSummary
              values={{
                salesPrice: values.salesPrice,
                miscCost: values.miscCost,
              }}
              totalIngredientCost={totalIngredientCost}
              errors={{
                salesPrice: errors.salesPrice,
                miscCost: errors.miscCost,
              }}
              onChange={(key, value) => updateField(key, value)}
            />
          </RecipeFormSection>

          <RecipeFormSection
            step="04"
            title="Yield"
            description="Optional batch size and portion for per-serving cost."
          >
            <YieldServingOptions
              values={{
                yieldQuantity: values.yieldQuantity,
                yieldUnit: values.yieldUnit,
                servingSizeQuantity: values.servingSizeQuantity,
                servingSizeUnit: values.servingSizeUnit,
              }}
              totalCost={totalCost}
              errors={{
                yieldQuantity: errors.yieldQuantity,
                yieldUnit: errors.yieldUnit,
                servingSizeQuantity: errors.servingSizeQuantity,
                servingSizeUnit: errors.servingSizeUnit,
              }}
              onChange={(key, value) => updateField(key, value)}
            />
          </RecipeFormSection>
        </div>
      </form>
    </Modal>
  );
}
