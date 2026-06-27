"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Modal } from "@/component/Modal";
import { RECIPE_CATEGORIES } from "@/lib/mock/lookups";
import {
  createEmptyRecipeFormValues,
  type CreateRecipeFormValues,
} from "@/types/recipe";

type CreateRecipeModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (values: CreateRecipeFormValues) => void;
};

type FormErrors = Partial<Record<keyof CreateRecipeFormValues, string>>;

const inputClassName =
  "rounded-md border border-border/80 bg-surface px-2.5 py-1.5 text-sm text-text-primary shadow-sm transition-[border-color,box-shadow] outline-none placeholder:text-text-muted/60 hover:border-text-muted/30 focus:border-accent/50 focus:ring-2 focus:ring-accent/15 w-full";
const selectClassName = `${inputClassName} appearance-none pr-8`;
const labelClassName = "text-xs font-medium text-text-secondary";

function Field({
  label,
  required,
  error,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className ?? ""}`}>
      <label className={labelClassName}>
        {label}
        {required && <span className="text-error"> *</span>}
      </label>
      {children}
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}

function SelectInput({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      {children}
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-text-muted"
        aria-hidden
      />
    </div>
  );
}

function validateForm(values: CreateRecipeFormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.name.trim()) errors.name = "Recipe name is required.";
  if (!values.category) errors.category = "Category is required.";
  if (!values.yield.trim()) errors.yield = "Yield is required.";
  if (!values.foodCost.trim()) {
    errors.foodCost = "Food cost is required.";
  } else if (
    Number.isNaN(parseFloat(values.foodCost)) ||
    parseFloat(values.foodCost) < 0
  ) {
    errors.foodCost = "Food cost must be a valid number.";
  }
  if (!values.menuPrice.trim()) {
    errors.menuPrice = "Menu price is required.";
  } else if (
    Number.isNaN(parseFloat(values.menuPrice)) ||
    parseFloat(values.menuPrice) < 0
  ) {
    errors.menuPrice = "Menu price must be a valid number.";
  }
  if (values.prepTimeMinutes.trim()) {
    const prepTime = parseFloat(values.prepTimeMinutes);
    if (Number.isNaN(prepTime) || prepTime < 0) {
      errors.prepTimeMinutes = "Prep time must be a valid number.";
    }
  }

  return errors;
}

export function CreateRecipeModal({
  open,
  onClose,
  onSave,
}: CreateRecipeModalProps) {
  const [values, setValues] = useState<CreateRecipeFormValues>(
    createEmptyRecipeFormValues(),
  );
  const [errors, setErrors] = useState<FormErrors>({});

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

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const validationErrors = validateForm(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    onSave(values);
    onClose();
  }

  const footer = (
    <div className="flex justify-end gap-2.5">
      <button
        type="button"
        onClick={onClose}
        className="rounded-md border border-border/80 bg-surface px-3.5 py-1.5 text-sm font-medium text-text-secondary shadow-sm transition-colors hover:border-text-muted/30 hover:text-text-primary"
      >
        Cancel
      </button>
      <button
        type="submit"
        form="create-recipe-form"
        className="rounded-md bg-accent px-3.5 py-1.5 text-sm font-medium text-text-primary shadow-sm transition-colors hover:bg-accent-hover"
      >
        Save recipe
      </button>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create Recipe"
      description="Add a new recipe to your catalog."
      footer={footer}
      size="md"
    >
      <form
        id="create-recipe-form"
        onSubmit={handleSubmit}
        className="grid gap-3 sm:grid-cols-2"
      >
        <Field
          label="Recipe Name"
          required
          error={errors.name}
          className="sm:col-span-2"
        >
          <input
            type="text"
            value={values.name}
            onChange={(event) => updateField("name", event.target.value)}
            className={inputClassName}
          />
        </Field>
        <Field label="Category" required error={errors.category}>
          <SelectInput>
            <select
              value={values.category}
              onChange={(event) => updateField("category", event.target.value)}
              className={selectClassName}
            >
              <option value="">Select category</option>
              {RECIPE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </SelectInput>
        </Field>
        <Field label="Yield" required error={errors.yield}>
          <input
            type="text"
            placeholder="e.g. 16 oz, 1 serving"
            value={values.yield}
            onChange={(event) => updateField("yield", event.target.value)}
            className={inputClassName}
          />
        </Field>
        <Field label="Food Cost" required error={errors.foodCost}>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-text-muted">
              $
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={values.foodCost}
              onChange={(event) => updateField("foodCost", event.target.value)}
              className={`${inputClassName} pl-6`}
            />
          </div>
        </Field>
        <Field label="Menu Price" required error={errors.menuPrice}>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-text-muted">
              $
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={values.menuPrice}
              onChange={(event) => updateField("menuPrice", event.target.value)}
              className={`${inputClassName} pl-6`}
            />
          </div>
        </Field>
        <Field label="Prep Time (minutes)" error={errors.prepTimeMinutes}>
          <input
            type="number"
            min="0"
            step="1"
            value={values.prepTimeMinutes}
            onChange={(event) =>
              updateField("prepTimeMinutes", event.target.value)
            }
            className={inputClassName}
          />
        </Field>
        <Field label="Notes" className="sm:col-span-2">
          <textarea
            rows={3}
            value={values.notes}
            onChange={(event) => updateField("notes", event.target.value)}
            className={inputClassName}
          />
        </Field>
      </form>
    </Modal>
  );
}
