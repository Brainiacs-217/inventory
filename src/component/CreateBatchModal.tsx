"use client";

import { useEffect, useRef, useState } from "react";

import { BatchIdentityForm } from "@/component/batch/BatchIdentityForm";
import { BatchIngredientList } from "@/component/batch/BatchIngredientList";
import { BatchIngredientSearch } from "@/component/batch/BatchIngredientSearch";
import { RecipeFormSection } from "@/component/recipe/formShared";
import { Modal } from "@/component/Modal";
import {
  createEmptyBatchFormValues,
  type BatchIngredientInput,
  type CreateBatchFormValues,
} from "@/types/batch";
import type { InventoryItem } from "@/types/item";
import type { UnitOption } from "@/types/recipe";

type CreateBatchModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (values: CreateBatchFormValues) => Promise<void>;
  catalogItems: InventoryItem[];
  units: UnitOption[];
  mode?: "create" | "edit";
  initialValues?: CreateBatchFormValues | null;
};

type FormErrors = Partial<
  Record<"name" | "yieldQuantity" | "yieldUnitId" | "ingredients", string>
>;

function validateForm(values: CreateBatchFormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.name.trim()) {
    errors.name = "Batch name is required.";
  }

  const yieldQuantity = parseFloat(values.yieldQuantity);
  if (
    !values.yieldQuantity.trim() ||
    Number.isNaN(yieldQuantity) ||
    yieldQuantity <= 0
  ) {
    errors.yieldQuantity = "Yield must be greater than 0.";
  }

  if (!values.yieldUnitId) {
    errors.yieldUnitId = "Yield unit is required.";
  }

  if (values.ingredients.length === 0) {
    errors.ingredients = "Add at least one item.";
  }

  for (const ingredient of values.ingredients) {
    const amount = parseFloat(ingredient.quantity);
    if (
      !ingredient.itemId ||
      !ingredient.unitId ||
      !ingredient.quantity.trim() ||
      Number.isNaN(amount) ||
      amount <= 0
    ) {
      errors.ingredients = "Each line needs an item, quantity greater than 0, and unit.";
      break;
    }
  }

  return errors;
}

function seedBatchValues(initialValues: CreateBatchFormValues | null): CreateBatchFormValues {
  if (!initialValues) return createEmptyBatchFormValues();
  return {
    ...initialValues,
    ingredients: initialValues.ingredients.map((ingredient) => ({ ...ingredient })),
  };
}

export function CreateBatchModal({
  open,
  onClose,
  onSave,
  catalogItems,
  units,
  mode = "create",
  initialValues = null,
}: CreateBatchModalProps) {
  const [values, setValues] = useState<CreateBatchFormValues>(
    createEmptyBatchFormValues(),
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const initialValuesRef = useRef(initialValues);
  initialValuesRef.current = initialValues;

  useEffect(() => {
    if (!open) return;
    setValues(seedBatchValues(initialValuesRef.current));
    setErrors({});
    setSaving(false);
    setSubmitError(null);
  }, [open]);

  function updateField<K extends keyof CreateBatchFormValues>(
    key: K,
    value: CreateBatchFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function handleAddIngredient(ingredient: BatchIngredientInput) {
    updateField("ingredients", [...values.ingredients, ingredient]);
  }

  function handleUpdateIngredient(
    id: string,
    patch: Partial<Pick<BatchIngredientInput, "quantity" | "unitId">>,
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
      const scrollId = validationErrors.name
        ? "batch-name"
        : validationErrors.yieldQuantity || validationErrors.yieldUnitId
          ? "batch-yield"
          : "batch-ingredients";
      requestAnimationFrame(() => {
        document.getElementById(scrollId)?.scrollIntoView({ block: "center" });
      });
      return;
    }

    setSaving(true);
    setSubmitError(null);
    try {
      await onSave(values);
      onClose();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Failed to save batch.",
      );
    } finally {
      setSaving(false);
    }
  }

  const footer = (
    <div className="flex flex-col gap-2">
      {submitError ? <p className="text-xs text-error">{submitError}</p> : null}
      <div className="flex gap-2.5 md:justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="rounded-sm border border-border/80 bg-surface px-3.5 py-1.5 text-sm font-medium text-text-secondary shadow-sm transition-colors hover:border-text-muted/30 hover:text-text-primary disabled:opacity-50 max-md:min-h-11 max-md:flex-1 max-md:text-base"
        >
          Cancel
        </button>
        <button
          type="submit"
          form="create-batch-form"
          disabled={saving}
          className="rounded-sm bg-accent px-3.5 py-1.5 text-sm font-medium text-text-primary shadow-sm transition-colors hover:bg-accent-hover disabled:opacity-50 max-md:min-h-11 max-md:flex-1 max-md:text-base"
        >
          {saving ? "Saving…" : "Save batch"}
        </button>
      </div>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "edit" ? "Edit batch" : "Create batch"}
      footer={footer}
      size="xl"
      mobileSheet
      bodyClassName="overflow-y-auto overscroll-contain py-4 md:py-3"
    >
      <form
        id="create-batch-form"
        onSubmit={handleSubmit}
        onFocus={(event) => {
          if (!window.matchMedia("(max-width: 767px)").matches) return;
          const target = event.target;
          if (!(target instanceof HTMLElement)) return;
          window.setTimeout(() => {
            target.scrollIntoView({ block: "center" });
          }, 300);
        }}
        className="flex flex-col gap-6 pb-4 md:gap-3 md:pb-0"
      >
        <RecipeFormSection
          step="01"
          title="Batch"
          description="Name the batch and how much one batch makes."
        >
          <BatchIdentityForm
            name={values.name}
            yieldQuantity={values.yieldQuantity}
            yieldUnitId={values.yieldUnitId}
            units={units}
            errors={errors}
            onNameChange={(name) => updateField("name", name)}
            onYieldQuantityChange={(yieldQuantity) =>
              updateField("yieldQuantity", yieldQuantity)
            }
            onYieldUnitChange={(yieldUnitId) => updateField("yieldUnitId", yieldUnitId)}
          />
        </RecipeFormSection>

        <RecipeFormSection
          step="02"
          title="Ingredients"
          description="Each line is an item, with quantity and unit."
        >
          <div id="batch-ingredients" className="flex scroll-my-4 flex-col gap-2.5">
            <BatchIngredientSearch
              catalogItems={catalogItems}
              units={units}
              onAdd={handleAddIngredient}
            />
            <BatchIngredientList
              ingredients={values.ingredients}
              catalogItems={catalogItems}
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
