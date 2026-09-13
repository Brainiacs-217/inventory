"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Modal } from "@/component/Modal";
import {
  RecipeFormSection,
  recipeFieldGridClassName,
} from "@/component/recipe/formShared";
import { calculateItemCost, formatCostValue } from "@/lib/items/cost";
import {
  BASE_UNITS,
  BEVERAGE_SUB_CATEGORIES,
  VENDORS,
} from "@/lib/lookups";
import {
  createEmptyItemFormValues,
  type CreateItemFormValues,
} from "@/types/item";

type BeverageFormValues = {
  name: string;
  subCategory: string;
  baseUnit: string;
  caseSize: string;
  unitSize: string;
  vendor: string;
  sku: string;
  price: string;
  comments: string;
};

type CreateItemModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (values: CreateItemFormValues) => Promise<void>;
};

type FormErrors = Partial<Record<keyof BeverageFormValues, string>>;

const inputClassName =
  "rounded-sm border border-border/80 bg-surface px-2.5 py-1.5 text-sm text-text-primary shadow-sm transition-[border-color,box-shadow] outline-none placeholder:text-text-muted/60 hover:border-text-muted/30 focus:border-accent/50 focus:ring-2 focus:ring-accent/15 w-full";
const selectClassName = `${inputClassName} appearance-none pr-8`;
const labelClassName =
  "text-[10px] font-medium uppercase tracking-[0.14em] text-text-muted";

function createEmptyBeverageFormValues(): BeverageFormValues {
  return {
    name: "",
    subCategory: "",
    baseUnit: "",
    caseSize: "",
    unitSize: "",
    vendor: "",
    sku: "",
    price: "",
    comments: "",
  };
}

function unitOfMeasureFromBaseUnit(baseUnit: string): string {
  switch (baseUnit) {
    case "lb":
      return "lb";
    case "each":
      return "each";
    default:
      return "fl. oz";
  }
}

function toCreateItemFormValues(values: BeverageFormValues): CreateItemFormValues {
  const cost = calculateItemCost(values.price, values.caseSize);
  const unitOfMeasure = unitOfMeasureFromBaseUnit(values.baseUnit);

  return {
    ...createEmptyItemFormValues(),
    name: values.name.trim(),
    category: "Beverage",
    caseSize: values.caseSize,
    unitSize: values.unitSize,
    unitOfMeasure,
    unitName: "bottle",
    vendor: values.vendor,
    sku: values.sku,
    price: values.price,
    reportingUnit: "bottle",
    baseUnit: values.baseUnit,
    cost: cost !== null ? formatCostValue(cost) : "0",
    costManuallyEdited: false,
    notes: values.comments.trim(),
  };
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

function Field({
  label,
  required,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex min-w-0 flex-col gap-1 ${className ?? ""}`}>
      <label className={labelClassName}>
        {label}
        {required ? <span className="text-error"> *</span> : null}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-error">{error}</p>
      ) : hint ? (
        <p className="text-[11px] leading-snug text-text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

function validateForm(values: BeverageFormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.name.trim()) errors.name = "Name is required.";
  if (!values.subCategory) errors.subCategory = "Sub category is required.";
  if (!values.baseUnit) errors.baseUnit = "Base unit is required.";

  if (!values.unitSize.trim()) {
    errors.unitSize = "Unit size is required.";
  } else if (
    Number.isNaN(parseFloat(values.unitSize)) ||
    parseFloat(values.unitSize) <= 0
  ) {
    errors.unitSize = "Unit size must be a positive number.";
  }

  if (!values.caseSize.trim()) {
    errors.caseSize = "Case size is required.";
  } else {
    const caseSize = parseFloat(values.caseSize);
    if (Number.isNaN(caseSize) || caseSize <= 0) {
      errors.caseSize = "Case size must be a positive number.";
    }
  }

  if (!values.vendor) errors.vendor = "Vendor is required.";

  if (!values.price.trim()) {
    errors.price = "Price is required.";
  } else if (
    Number.isNaN(parseFloat(values.price)) ||
    parseFloat(values.price) < 0
  ) {
    errors.price = "Price must be a valid number.";
  }

  return errors;
}

export function CreateItemModal({ open, onClose, onSave }: CreateItemModalProps) {
  const [values, setValues] = useState(createEmptyBeverageFormValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setValues(createEmptyBeverageFormValues());
    setErrors({});
    setSaving(false);
    setSubmitError(null);
  }, [open]);

  function updateField<K extends keyof BeverageFormValues>(
    key: K,
    value: BeverageFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const validationErrors = validateForm(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    setSubmitError(null);

    try {
      await onSave(toCreateItemFormValues(values));
      onClose();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Failed to save item.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create beverage"
      size="xl"
      bodyClassName="overflow-hidden py-3"
      footer={
        <div className="flex flex-col gap-2">
          {submitError ? <p className="text-xs text-error">{submitError}</p> : null}
          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-sm border border-border/80 bg-surface px-3.5 py-1.5 text-sm font-medium text-text-secondary shadow-sm transition-colors hover:border-text-muted/30 hover:text-text-primary disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="create-beverage-form"
              disabled={saving}
              className="rounded-sm bg-accent px-3.5 py-1.5 text-sm font-medium text-text-primary shadow-sm transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save item"}
            </button>
          </div>
        </div>
      }
    >
      <form
        id="create-beverage-form"
        onSubmit={handleSubmit}
        className="grid grid-cols-2 gap-3"
      >
        <RecipeFormSection
          step="01"
          title="Identity"
          description="What is this beverage called?"
        >
          <div className={recipeFieldGridClassName}>
            <Field label="Name" required error={errors.name}>
              <input
                type="text"
                placeholder="e.g. Bud Light 12oz"
                value={values.name}
                onChange={(event) => updateField("name", event.target.value)}
                className={inputClassName}
                autoFocus
              />
            </Field>

            <Field label="Sub category" required error={errors.subCategory}>
              <SelectInput>
                <select
                  value={values.subCategory}
                  onChange={(event) =>
                    updateField("subCategory", event.target.value)
                  }
                  className={selectClassName}
                >
                  <option value="">Select sub category</option>
                  {BEVERAGE_SUB_CATEGORIES.map((subCategory) => (
                    <option key={subCategory} value={subCategory}>
                      {subCategory}
                    </option>
                  ))}
                </select>
              </SelectInput>
            </Field>
          </div>
        </RecipeFormSection>

        <RecipeFormSection
          step="02"
          title="Packaging"
          description="How each case and unit is measured."
        >
          <div className={recipeFieldGridClassName}>
            <Field label="Case size" required error={errors.caseSize}>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="e.g. 24"
                value={values.caseSize}
                onChange={(event) => updateField("caseSize", event.target.value)}
                className={inputClassName}
              />
            </Field>

            <Field
              label="Unit size"
              required
              error={errors.unitSize ?? errors.baseUnit}
            >
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="e.g. 12"
                  value={values.unitSize}
                  onChange={(event) => updateField("unitSize", event.target.value)}
                  className={`${inputClassName} min-w-0 flex-1`}
                />
                <SelectInput>
                  <select
                    value={values.baseUnit}
                    onChange={(event) =>
                      updateField("baseUnit", event.target.value)
                    }
                    aria-label="Base unit"
                    className={`${selectClassName} w-24 shrink-0`}
                  >
                    <option value="">Unit</option>
                    {BASE_UNITS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </SelectInput>
              </div>
            </Field>
          </div>
        </RecipeFormSection>

        <RecipeFormSection
          step="03"
          title="Purchasing"
          description="Vendor, price, and optional SKU."
        >
          <div className={recipeFieldGridClassName}>
            <Field label="Vendor" required error={errors.vendor}>
              <SelectInput>
                <select
                  value={values.vendor}
                  onChange={(event) => updateField("vendor", event.target.value)}
                  className={selectClassName}
                >
                  <option value="">Select vendor</option>
                  {VENDORS.map((vendor) => (
                    <option key={vendor} value={vendor}>
                      {vendor}
                    </option>
                  ))}
                </select>
              </SelectInput>
            </Field>

            <Field label="Price" required error={errors.price}>
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-text-muted">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={values.price}
                  onChange={(event) => updateField("price", event.target.value)}
                  className={`${inputClassName} pl-6`}
                />
              </div>
            </Field>

            <Field label="SKU" error={errors.sku} className="col-span-2">
              <input
                type="text"
                placeholder="Optional"
                value={values.sku}
                onChange={(event) => updateField("sku", event.target.value)}
                className={inputClassName}
              />
            </Field>
          </div>
        </RecipeFormSection>

        <RecipeFormSection
          step="04"
          title="Notes"
          description="Optional notes about this beverage."
        >
          <Field label="Comments" className="h-full min-h-0">
            <textarea
              placeholder="Optional"
              value={values.comments}
              onChange={(event) => updateField("comments", event.target.value)}
              className={`${inputClassName} min-h-0 flex-1 resize-none`}
            />
          </Field>
        </RecipeFormSection>
      </form>
    </Modal>
  );
}
