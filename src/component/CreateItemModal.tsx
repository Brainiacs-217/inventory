"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Modal } from "@/component/Modal";
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
  "w-full rounded-sm border border-border/80 bg-surface px-2.5 py-1.5 text-sm text-text-primary shadow-sm transition-[border-color,box-shadow] outline-none placeholder:text-text-muted/60 hover:border-text-muted/30 focus:border-accent/50 focus:ring-2 focus:ring-accent/15 max-md:min-h-11 max-md:text-base";
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

function BeverageSection({
  step,
  title,
  description,
  children,
}: {
  step: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 md:h-full md:gap-0 md:overflow-hidden md:rounded-sm md:border md:border-border/80 md:bg-surface">
      <header className="md:border-b md:border-border/80 md:bg-surface-muted/25 md:px-3 md:py-2">
        <h3 className="text-[10px] font-medium uppercase tracking-[0.14em] text-text-muted md:hidden">
          {title}
        </h3>
        <div className="hidden items-start gap-2.5 md:flex">
          <span className="pt-0.5 text-xs font-bold tabular-nums tracking-wide text-text-primary">
            {step}
          </span>
          <div className="flex min-w-0 flex-1 items-start gap-2">
            <span
              className="mt-1 h-3 w-0.5 shrink-0 rounded-full bg-accent"
              aria-hidden
            />
            <div className="min-w-0">
              <h3 className="text-sm font-medium tracking-tight text-text-primary">
                {title}
              </h3>
              <p className="mt-0.5 line-clamp-1 text-[11px] leading-snug text-text-muted">
                {description}
              </p>
            </div>
          </div>
        </div>
      </header>
      <div className="flex flex-col md:min-h-0 md:flex-1 md:p-3">{children}</div>
    </section>
  );
}

function Field({
  id,
  label,
  required,
  error,
  hint,
  children,
  className,
}: {
  id?: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      id={id}
      className={`flex min-w-0 scroll-my-4 flex-col gap-1 ${className ?? ""}`}
    >
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
      const order = [
        "name",
        "subCategory",
        "caseSize",
        "unitSize",
        "baseUnit",
        "vendor",
        "price",
      ] as const;
      const first = order.find((key) => validationErrors[key]);
      const scrollId = first === "baseUnit" ? "unitSize" : first;
      if (scrollId) {
        requestAnimationFrame(() => {
          document
            .getElementById(`beverage-${scrollId}`)
            ?.scrollIntoView({ block: "center" });
        });
      }
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
      mobileSheet
      bodyClassName="overflow-y-auto overscroll-contain py-4 md:overflow-hidden md:py-3"
      footer={
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
              form="create-beverage-form"
              disabled={saving}
              className="rounded-sm bg-accent px-3.5 py-1.5 text-sm font-medium text-text-primary shadow-sm transition-colors hover:bg-accent-hover disabled:opacity-50 max-md:min-h-11 max-md:flex-1 max-md:text-base"
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
        onFocus={(event) => {
          if (!window.matchMedia("(max-width: 767px)").matches) return;
          const target = event.target;
          if (!(target instanceof HTMLElement)) return;
          window.setTimeout(() => {
            target.scrollIntoView({ block: "center" });
          }, 300);
        }}
        className="flex flex-col gap-6 pb-4 md:grid md:h-auto md:grid-cols-2 md:gap-3 md:pb-0"
      >
        <BeverageSection
          step="01"
          title="Identity"
          description="What is this beverage called?"
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-x-3 md:gap-y-2.5">
            <Field id="beverage-name" label="Name" required error={errors.name}>
              <input
                type="text"
                placeholder="e.g. Bud Light 12oz"
                value={values.name}
                onChange={(event) => updateField("name", event.target.value)}
                className={inputClassName}
              />
            </Field>

            <Field
              id="beverage-subCategory"
              label="Sub category"
              required
              error={errors.subCategory}
            >
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
        </BeverageSection>

        <BeverageSection
          step="02"
          title="Packaging"
          description="How each case and unit is measured."
        >
          <div className="grid grid-cols-[minmax(0,5.5rem)_minmax(0,1fr)] gap-3 md:grid-cols-2 md:gap-x-3 md:gap-y-2.5">
            <Field
              id="beverage-caseSize"
              label="Case size"
              required
              error={errors.caseSize}
            >
              <input
                type="number"
                min="0"
                step="any"
                placeholder="24"
                value={values.caseSize}
                onChange={(event) => updateField("caseSize", event.target.value)}
                className={inputClassName}
              />
            </Field>

            <Field
              id="beverage-unitSize"
              label="Unit size"
              required
              error={errors.unitSize ?? errors.baseUnit}
            >
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="12"
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
                    className={`${selectClassName} w-[4.5rem] shrink-0 md:w-24`}
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
        </BeverageSection>

        <BeverageSection
          step="03"
          title="Purchasing"
          description="Vendor, price, and optional SKU."
        >
          <div className="grid grid-cols-2 gap-3 md:gap-x-3 md:gap-y-2.5">
            <Field
              id="beverage-vendor"
              label="Vendor"
              required
              error={errors.vendor}
              className="col-span-2 md:col-span-1"
            >
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

            <Field id="beverage-price" label="Price" required error={errors.price}>
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

            <Field label="SKU" error={errors.sku} className="md:col-span-2">
              <input
                type="text"
                placeholder="Optional"
                value={values.sku}
                onChange={(event) => updateField("sku", event.target.value)}
                className={inputClassName}
              />
            </Field>
          </div>
        </BeverageSection>

        <BeverageSection
          step="04"
          title="Notes"
          description="Optional notes about this beverage."
        >
          <Field label="Comments" className="md:h-full md:min-h-0">
            <textarea
              rows={3}
              placeholder="Optional"
              value={values.comments}
              onChange={(event) => updateField("comments", event.target.value)}
              className={`${inputClassName} h-24 resize-none md:h-auto md:min-h-0 md:flex-1`}
            />
          </Field>
        </BeverageSection>
      </form>
    </Modal>
  );
}
