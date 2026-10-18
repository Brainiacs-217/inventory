"use client";

import { useEffect, useState } from "react";

import { IngredientSearch } from "@/component/recipe/IngredientSearch";
import { RecipeIdentityForm } from "@/component/recipe/RecipeIdentityForm";
import { RecipeIngredientList } from "@/component/recipe/RecipeIngredientList";
import { RecipeFormSection } from "@/component/recipe/formShared";
import { Modal } from "@/component/Modal";
import type { InventoryItem } from "@/types/item";
import {
  createEmptyRecipeFormValues,
  type BatchOption,
  type CreateRecipeFormValues,
  type RecipeIngredientInput,
  type UnitOption,
} from "@/types/recipe";

type CreateRecipeModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (values: CreateRecipeFormValues) => Promise<void>;
  catalogItems: InventoryItem[];
  batches: BatchOption[];
  units: UnitOption[];
};

type FormErrors = Partial<Record<"name" | "ingredients", string>>;

function validateForm(values: CreateRecipeFormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.name.trim()) {
    errors.name = "Recipe name is required.";
  }

  if (values.ingredients.length === 0) {
    errors.ingredients = "Add at least one item or batch.";
  }

  for (const ingredient of values.ingredients) {
    const amount = parseFloat(ingredient.quantity);
    const hasSource =
      ingredient.source === "item"
        ? Boolean(ingredient.itemId)
        : Boolean(ingredient.batchId);

    if (
      !hasSource ||
      !ingredient.unitId ||
      !ingredient.quantity.trim() ||
      Number.isNaN(amount) ||
      amount <= 0
    ) {
      errors.ingredients = "Each line needs a source, quantity greater than 0, and unit.";
      break;
    }
  }

  return errors;
}

export function CreateRecipeModal({
  open,
  onClose,
  onSave,
  catalogItems,
  batches,
  units,
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

  function updateField<K extends keyof CreateRecipeFormValues>(
    key: K,
    value: CreateRecipeFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function handleAddIngredient(ingredient: RecipeIngredientInput) {
    updateField("ingredients", [...values.ingredients, ingredient]);
  }

  function handleUpdateIngredient(
    id: string,
    patch: Partial<Pick<RecipeIngredientInput, "quantity" | "unitId" | "role" | "note">>,
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
        <RecipeFormSection
          step="01"
          title="Recipe"
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
          description="Each line is an item or a batch, with quantity, unit, role, and an optional note."
        >
          <div className="flex h-full flex-col gap-2.5">
            <IngredientSearch
              catalogItems={catalogItems}
              batches={batches}
              units={units}
              onAdd={handleAddIngredient}
            />
            <RecipeIngredientList
              ingredients={values.ingredients}
              catalogItems={catalogItems}
              batches={batches}
              units={units}
              onUpdate={handleUpdateIngredient}
              onRemove={handleRemoveIngredient}
            />
            {errors.ingredients ? (
              <p className="text-xs text-error">{errors.ingredients}</p>
            ) : null}
          </div>
        </RecipeFormSection>
      </form>
    </Modal>
  );
}
