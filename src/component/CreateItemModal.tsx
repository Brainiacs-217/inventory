"use client";

import { ChevronDown, Plus } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Modal } from "@/component/Modal";
import { calculateItemCost, formatCostValue } from "@/lib/itemCost";
import {
  BASE_UNITS,
  REPORTING_UNITS,
  UNITS_OF_MEASURE,
  VENDORS,
} from "@/lib/lookups";
import {
  createEmptyItemFormValues,
  type CreateItemFormValues,
} from "@/types/item";

type CreateItemModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (values: CreateItemFormValues) => void;
  categories: string[];
  onAddCategory: (name: string) => void;
};

type FormErrors = Partial<Record<keyof CreateItemFormValues, string>>;

const inputClassName =
  "rounded-sm border border-border/80 bg-surface px-2.5 py-1 text-sm text-text-primary shadow-sm transition-[border-color,box-shadow] outline-none placeholder:text-text-muted/60 hover:border-text-muted/30 focus:border-accent/50 focus:ring-2 focus:ring-accent/15 w-full";
const selectClassName = `${inputClassName} appearance-none pr-8`;
const labelClassName =
  "text-[10px] font-medium uppercase tracking-[0.14em] text-text-muted";

const sectionRowClassName = "grid grid-cols-2 gap-3";
const sectionFieldGridClassName = "grid grid-cols-2 gap-x-3 gap-y-2.5";

function FormSection({
  step,
  title,
  description,
  children,
  className,
}: {
  step: string;
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`flex h-full flex-col overflow-hidden rounded-sm border border-border/80 bg-surface ${className ?? ""}`}
    >
      <header className="border-b border-border/80 bg-surface-muted/25 px-3 py-2">
        <div className="flex items-start gap-2.5">
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
      <div className="flex flex-1 flex-col p-3">{children}</div>
    </section>
  );
}

function SelectInput({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative ${className ?? ""}`}>
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

function validateForm(values: CreateItemFormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.name.trim()) errors.name = "Item name is required.";
  if (!values.category) errors.category = "Category is required.";
  if (!values.unitSize.trim()) {
    errors.unitSize = "Unit size is required.";
  } else if (
    Number.isNaN(parseFloat(values.unitSize)) ||
    parseFloat(values.unitSize) <= 0
  ) {
    errors.unitSize = "Unit size must be a positive number.";
  }
  if (!values.unitOfMeasure) errors.unitOfMeasure = "Unit of measure is required.";
  if (!values.unitName.trim()) errors.unitName = "Unit name is required.";
  if (!values.vendor) errors.vendor = "Vendor is required.";
  if (!values.price.trim()) {
    errors.price = "Price is required.";
  } else if (
    Number.isNaN(parseFloat(values.price)) ||
    parseFloat(values.price) < 0
  ) {
    errors.price = "Price must be a valid number.";
  }
  if (!values.reportingUnit) errors.reportingUnit = "Reporting unit is required.";
  if (!values.baseUnit) errors.baseUnit = "Base unit is required.";
  if (!values.cost.trim()) {
    errors.cost = "Cost is required.";
  } else if (
    Number.isNaN(parseFloat(values.cost)) ||
    parseFloat(values.cost) < 0
  ) {
    errors.cost = "Cost must be a valid number.";
  }

  if (values.caseSize.trim()) {
    const caseSize = parseFloat(values.caseSize);
    if (Number.isNaN(caseSize) || caseSize <= 0) {
      errors.caseSize = "Case size must be a positive number.";
    }
  }

  if (values.par.trim()) {
    const par = parseFloat(values.par);
    if (Number.isNaN(par) || par < 0) {
      errors.par = "Par must be a valid number.";
    }
  }

  return errors;
}

export function CreateItemModal({
  open,
  onClose,
  onSave,
  categories,
  onAddCategory,
}: CreateItemModalProps) {
  const [values, setValues] = useState<CreateItemFormValues>(
    createEmptyItemFormValues(),
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryError, setNewCategoryError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setValues(createEmptyItemFormValues());
    setErrors({});
    setSaving(false);
    setAddingCategory(false);
    setNewCategoryName("");
    setNewCategoryError(null);
  }, [open]);

  useEffect(() => {
    if (values.costManuallyEdited) return;

    const calculated = calculateItemCost(values.price, values.caseSize);
    if (calculated === null) return;

    setValues((current) => {
      const nextCost = formatCostValue(calculated);
      if (current.cost === nextCost) return current;
      return { ...current, cost: nextCost };
    });
  }, [values.price, values.caseSize, values.costManuallyEdited]);

  function updateField<K extends keyof CreateItemFormValues>(
    key: K,
    value: CreateItemFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function handleCostChange(cost: string) {
    setValues((current) => ({
      ...current,
      cost,
      costManuallyEdited: true,
    }));
    setErrors((current) => {
      const next = { ...current };
      delete next.cost;
      return next;
    });
  }

  function resetCalculatedCost() {
    const calculated = calculateItemCost(values.price, values.caseSize);
    setValues((current) => ({
      ...current,
      cost: calculated !== null ? formatCostValue(calculated) : "",
      costManuallyEdited: false,
    }));
  }

  function handleAddCategorySubmit() {
    const name = newCategoryName.trim();
    if (!name) {
      setNewCategoryError("Category name is required.");
      return;
    }
    if (categories.some((category) => category.toLowerCase() === name.toLowerCase())) {
      setNewCategoryError("That category already exists.");
      return;
    }
    onAddCategory(name);
    updateField("category", name);
    setAddingCategory(false);
    setNewCategoryName("");
    setNewCategoryError(null);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const validationErrors = validateForm(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    onSave(values);
    setSaving(false);
    onClose();
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
        form="create-item-form"
        disabled={saving}
        className="rounded-sm bg-accent px-3.5 py-1.5 text-sm font-medium text-text-primary shadow-sm transition-colors hover:bg-accent-hover disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save item"}
      </button>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create item"
      footer={footer}
      size="xl"
      bodyClassName="overflow-hidden py-3"
    >
      <form
        id="create-item-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-3"
      >
        <div className={sectionRowClassName}>
          <FormSection
            step="01"
            title="Identity"
            description="What is this item? Start with a clear name and category."
          >
            <div className="flex h-full flex-col gap-2.5">
              <div className={sectionFieldGridClassName}>
                <Field label="Item name" required error={errors.name}>
                  <input
                    type="text"
                    placeholder="e.g. Whole milk"
                    value={values.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    className={inputClassName}
                    autoFocus
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
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </SelectInput>
                </Field>
              </div>
              {!addingCategory ? (
                <div className="mt-auto flex min-h-0 flex-1 flex-col">
                  <button
                    type="button"
                    onClick={() => setAddingCategory(true)}
                    className="inline-flex min-h-[2.75rem] w-full flex-1 items-center justify-center gap-1.5 rounded-sm border border-border/80 bg-surface px-2.5 py-2 text-sm font-medium text-text-secondary shadow-sm transition-colors hover:border-text-muted/30 hover:text-text-primary"
                  >
                    <Plus className="size-3.5" strokeWidth={2} aria-hidden />
                    New category
                  </button>
                </div>
              ) : (
                <div className="mt-auto flex flex-col gap-1">
                  <div className="flex items-stretch gap-2">
                    <input
                      type="text"
                      placeholder="Category name"
                      value={newCategoryName}
                      onChange={(event) => {
                        setNewCategoryName(event.target.value);
                        setNewCategoryError(null);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          handleAddCategorySubmit();
                        }
                      }}
                      className={`${inputClassName} min-w-0 flex-1`}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleAddCategorySubmit}
                      className="shrink-0 rounded-sm bg-accent px-3 py-1 text-sm font-medium text-text-primary shadow-sm transition-[background-color] hover:bg-accent-hover"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAddingCategory(false);
                        setNewCategoryName("");
                        setNewCategoryError(null);
                      }}
                      className="shrink-0 rounded-sm border border-border/80 bg-surface px-3 py-1 text-sm font-medium text-text-secondary shadow-sm transition-colors hover:border-text-muted/30 hover:text-text-primary"
                    >
                      Cancel
                    </button>
                  </div>
                  {newCategoryError ? (
                    <p className="text-xs text-error">{newCategoryError}</p>
                  ) : null}
                </div>
              )}
            </div>
          </FormSection>

          <FormSection
            step="02"
            title="Packaging"
            description="How the item is sold — case count, unit size, and what you call each unit."
          >
            <div className={sectionFieldGridClassName}>
            <Field label="Case size" error={errors.caseSize}>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="Optional"
                value={values.caseSize}
                onChange={(event) => updateField("caseSize", event.target.value)}
                className={inputClassName}
              />
            </Field>
            <Field label="Unit size" required error={errors.unitSize}>
              <input
                type="number"
                min="0"
                step="any"
                value={values.unitSize}
                onChange={(event) => updateField("unitSize", event.target.value)}
                className={inputClassName}
              />
            </Field>
            <Field label="Unit of measure" required error={errors.unitOfMeasure}>
              <SelectInput>
                <select
                  value={values.unitOfMeasure}
                  onChange={(event) =>
                    updateField("unitOfMeasure", event.target.value)
                  }
                  className={selectClassName}
                >
                  <option value="">Select unit</option>
                  {UNITS_OF_MEASURE.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </SelectInput>
            </Field>
            <Field label="Unit name" required error={errors.unitName}>
              <input
                type="text"
                placeholder="bottle, tub, bag"
                value={values.unitName}
                onChange={(event) => updateField("unitName", event.target.value)}
                className={inputClassName}
              />
            </Field>
            </div>
          </FormSection>
        </div>

        <div className={sectionRowClassName}>
          <FormSection
            step="03"
            title="Purchasing"
            description="Who you buy from and what you pay per case or unit."
          >
            <div className={sectionFieldGridClassName}>
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
              <Field label="SKU" error={errors.sku}>
                <input
                  type="text"
                  placeholder="Optional"
                  value={values.sku}
                  onChange={(event) => updateField("sku", event.target.value)}
                  className={inputClassName}
                />
              </Field>
              <Field label="Price" required error={errors.price} className="col-span-2">
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
            </div>
          </FormSection>

          <FormSection
            step="04"
            title="Reporting & par"
            description="How inventory is counted, costed, and restocked."
          >
            <div className={sectionFieldGridClassName}>
              <Field label="Reporting unit" required error={errors.reportingUnit}>
                <SelectInput>
                  <select
                    value={values.reportingUnit}
                    onChange={(event) =>
                      updateField("reportingUnit", event.target.value)
                    }
                    className={selectClassName}
                  >
                    <option value="">Select unit</option>
                    {REPORTING_UNITS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </SelectInput>
              </Field>
              <Field label="Base unit" required error={errors.baseUnit}>
                <SelectInput>
                  <select
                    value={values.baseUnit}
                    onChange={(event) =>
                      updateField("baseUnit", event.target.value)
                    }
                    className={selectClassName}
                  >
                    <option value="">Select unit</option>
                    {BASE_UNITS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </SelectInput>
              </Field>
              <Field label="Cost" required error={errors.cost}>
                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-text-muted">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={values.cost}
                    onChange={(event) => handleCostChange(event.target.value)}
                    className={`${inputClassName} pl-6`}
                  />
                </div>
                {values.costManuallyEdited ? (
                  <button
                    type="button"
                    onClick={resetCalculatedCost}
                    className="text-left text-[10px] text-accent underline-offset-4 hover:text-accent-hover hover:underline"
                  >
                    Reset to calculated
                  </button>
                ) : (
                  <p className="text-[10px] leading-tight text-text-muted">
                    Auto from price ÷ case size
                  </p>
                )}
              </Field>
              <Field label="Par" error={errors.par}>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Optional"
                  value={values.par}
                  onChange={(event) => updateField("par", event.target.value)}
                  className={inputClassName}
                />
              </Field>
            </div>
          </FormSection>
        </div>

        <FormSection
          step="05"
          title="Records"
          description="Accounting codes and internal notes."
        >
          <div className={sectionFieldGridClassName}>
            <Field label="GL code" error={errors.glCode}>
              <input
                type="text"
                placeholder="Optional"
                value={values.glCode}
                onChange={(event) => updateField("glCode", event.target.value)}
                className={inputClassName}
              />
            </Field>
            <Field label="Notes">
              <textarea
                rows={2}
                placeholder="Optional — prep notes, storage, substitutions"
                value={values.notes}
                onChange={(event) => updateField("notes", event.target.value)}
                className={`${inputClassName} resize-none`}
              />
            </Field>
          </div>
        </FormSection>
      </form>
    </Modal>
  );
}
