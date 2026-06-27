"use client";

import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Modal } from "@/component/Modal";
import { calculateItemCost, formatCostValue } from "@/lib/itemCost";
import {
  BASE_UNITS,
  CATEGORIES,
  CONVERSION_UNITS,
  REPORTING_UNITS,
  SUBCATEGORIES_BY_CATEGORY,
  UNITS_OF_MEASURE,
  VENDORS,
  WEIGHT_UNITS,
} from "@/lib/lookups";
import {
  createEmptyItemFormValues,
  type CreateItemFormValues,
  type ItemConversion,
} from "@/types/item";

type CreateItemModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (values: CreateItemFormValues) => void;
};

type FormErrors = Partial<Record<keyof CreateItemFormValues, string>> & {
  conversionFactors?: string[];
};

const inputClassName =
  "rounded-md border border-border/80 bg-surface px-2.5 py-1.5 text-sm text-text-primary shadow-sm transition-[border-color,box-shadow] outline-none placeholder:text-text-muted/60 hover:border-text-muted/30 focus:border-accent/50 focus:ring-2 focus:ring-accent/15 w-full";
const selectClassName = `${inputClassName} appearance-none pr-8`;
const labelClassName = "text-xs font-medium text-text-secondary";

const sectionPanelClassName =
  "flex flex-col gap-2.5 rounded-lg border border-border/60 bg-surface p-3.5 shadow-sm";

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 pb-0.5">
      <span
        className="h-3.5 w-0.5 shrink-0 rounded-full bg-accent"
        aria-hidden
      />
      <h3 className="text-xs font-semibold tracking-wide text-text-primary">
        {children}
      </h3>
    </div>
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

  if (values.useCustomWeights) {
    if (values.weights.tareWeight < 0) {
      errors.weights = "Tare weight must be zero or greater.";
    }
    if (values.weights.fullWeight <= 0) {
      errors.weights = "Full weight must be greater than zero.";
    }
    if (values.weights.fullWeight <= values.weights.tareWeight) {
      errors.weights = "Full weight must be greater than tare weight.";
    }
  }

  const conversionErrors: string[] = [];
  values.conversions.forEach((conversion, index) => {
    if (!conversion.fromUnit || !conversion.toUnit) {
      conversionErrors[index] = "Both units are required.";
    } else if (conversion.factor <= 0 || Number.isNaN(conversion.factor)) {
      conversionErrors[index] = "Factor must be a positive number.";
    }
  });
  if (conversionErrors.some(Boolean)) {
    errors.conversionFactors = conversionErrors;
  }

  return errors;
}

export function CreateItemModal({ open, onClose, onSave }: CreateItemModalProps) {
  const [values, setValues] = useState<CreateItemFormValues>(
    createEmptyItemFormValues(),
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  const subcategories = values.category
    ? (SUBCATEGORIES_BY_CATEGORY[values.category] ?? [])
    : [];

  useEffect(() => {
    if (!open) return;
    setValues(createEmptyItemFormValues());
    setErrors({});
    setSaving(false);
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

  function handleCategoryChange(category: string) {
    setValues((current) => ({
      ...current,
      category,
      subcategory: "",
    }));
    setErrors((current) => {
      const next = { ...current };
      delete next.category;
      delete next.subcategory;
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

  function addConversion() {
    setValues((current) => ({
      ...current,
      conversions: [
        ...current.conversions,
        { fromUnit: "", toUnit: "", factor: 1 },
      ],
    }));
  }

  function updateConversion(
    index: number,
    field: keyof ItemConversion,
    value: string | number,
  ) {
    setValues((current) => ({
      ...current,
      conversions: current.conversions.map((conversion, i) =>
        i === index ? { ...conversion, [field]: value } : conversion,
      ),
    }));
    setErrors((current) => {
      if (!current.conversionFactors) return current;
      const nextFactors = [...current.conversionFactors];
      delete nextFactors[index];
      return { ...current, conversionFactors: nextFactors };
    });
  }

  function removeConversion(index: number) {
    setValues((current) => ({
      ...current,
      conversions: current.conversions.filter((_, i) => i !== index),
    }));
    setErrors((current) => {
      if (!current.conversionFactors) return current;
      const nextFactors = current.conversionFactors.filter(
        (_, i) => i !== index,
      );
      return { ...current, conversionFactors: nextFactors };
    });
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
        className="rounded-md border border-border/80 bg-surface px-3.5 py-1.5 text-sm font-medium text-text-secondary shadow-sm transition-colors hover:border-text-muted/30 hover:text-text-primary"
      >
        Cancel
      </button>
      <button
        type="submit"
        form="create-item-form"
        disabled={saving}
        className="rounded-md bg-accent px-3.5 py-1.5 text-sm font-medium text-text-primary shadow-sm transition-colors hover:bg-accent-hover disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save item"}
      </button>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create Item"
      description="Add a new item to your catalog."
      footer={footer}
      size="xl"
    >
      <form
        id="create-item-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-3.5"
      >
        <div className="grid gap-3 lg:grid-cols-3">
          <section className={sectionPanelClassName}>
            <SectionHeading>Basic Info</SectionHeading>
            <div className="grid gap-2 sm:grid-cols-2">
              <Field
                label="Item Name"
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
                    onChange={(event) => handleCategoryChange(event.target.value)}
                    className={selectClassName}
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </SelectInput>
              </Field>
              {subcategories.length > 0 ? (
                <Field label="Subcategory" error={errors.subcategory}>
                  <SelectInput>
                    <select
                      value={values.subcategory}
                      onChange={(event) =>
                        updateField("subcategory", event.target.value)
                      }
                      className={selectClassName}
                    >
                      <option value="">Select subcategory</option>
                      {subcategories.map((subcategory) => (
                        <option key={subcategory} value={subcategory}>
                          {subcategory}
                        </option>
                      ))}
                    </select>
                  </SelectInput>
                </Field>
              ) : (
                <div className="hidden sm:block" />
              )}
            </div>
          </section>

          <section className={sectionPanelClassName}>
            <SectionHeading>Packaging</SectionHeading>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Case Size" error={errors.caseSize}>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={values.caseSize}
                  onChange={(event) =>
                    updateField("caseSize", event.target.value)
                  }
                  className={inputClassName}
                />
              </Field>
              <Field label="Unit Size" required error={errors.unitSize}>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={values.unitSize}
                  onChange={(event) =>
                    updateField("unitSize", event.target.value)
                  }
                  className={inputClassName}
                />
              </Field>
              <Field label="Unit of Measure" required error={errors.unitOfMeasure}>
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
              <Field label="Unit Name" required error={errors.unitName}>
                <input
                  type="text"
                  placeholder="bottle, tub, bag"
                  value={values.unitName}
                  onChange={(event) =>
                    updateField("unitName", event.target.value)
                  }
                  className={inputClassName}
                />
              </Field>
            </div>
          </section>

          <section className={sectionPanelClassName}>
            <SectionHeading>Vendor / Pricing</SectionHeading>
            <div className="grid grid-cols-2 gap-2">
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
          </section>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          <section className={`${sectionPanelClassName} lg:col-span-2`}>
            <SectionHeading>Reporting</SectionHeading>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Field label="Reporting Unit" required error={errors.reportingUnit}>
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
              <Field label="Base Unit" required error={errors.baseUnit}>
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
                    className="text-left text-[11px] text-accent hover:text-accent-hover underline-offset-4 hover:underline"
                  >
                    Reset to calculated
                  </button>
                ) : (
                  <p className="text-[11px] text-text-muted">Auto-calculated from price</p>
                )}
              </Field>
              <Field label="Par" error={errors.par}>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={values.par}
                  onChange={(event) => updateField("par", event.target.value)}
                  className={inputClassName}
                />
              </Field>
            </div>

            <div className="flex flex-col gap-2 rounded-md border border-dashed border-border/80 bg-surface-muted/30 p-2.5">
              <div className="flex items-center justify-between">
                <span className={labelClassName}>Conversions</span>
                <button
                  type="button"
                  onClick={addConversion}
                  className="inline-flex items-center gap-1 rounded-md border border-border/80 bg-surface px-2 py-1 text-[11px] font-medium text-text-secondary shadow-sm transition-colors hover:border-accent/40 hover:text-text-primary"
                >
                  <Plus className="size-3" />
                  Add
                </button>
              </div>
              {values.conversions.length > 0 && (
                <div className="flex flex-col gap-2">
                  {values.conversions.map((conversion, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-[1fr_1fr_0.75fr_auto] items-end gap-2 rounded-md border border-border/60 bg-surface p-2"
                    >
                      <Field label="From">
                        <SelectInput>
                          <select
                            value={conversion.fromUnit}
                            onChange={(event) =>
                              updateConversion(
                                index,
                                "fromUnit",
                                event.target.value,
                              )
                            }
                            className={selectClassName}
                          >
                            <option value="">Unit</option>
                            {CONVERSION_UNITS.map((unit) => (
                              <option key={unit} value={unit}>
                                {unit}
                              </option>
                            ))}
                          </select>
                        </SelectInput>
                      </Field>
                      <Field label="To">
                        <SelectInput>
                          <select
                            value={conversion.toUnit}
                            onChange={(event) =>
                              updateConversion(index, "toUnit", event.target.value)
                            }
                            className={selectClassName}
                          >
                            <option value="">Unit</option>
                            {CONVERSION_UNITS.map((unit) => (
                              <option key={unit} value={unit}>
                                {unit}
                              </option>
                            ))}
                          </select>
                        </SelectInput>
                      </Field>
                      <Field
                        label="Factor"
                        error={errors.conversionFactors?.[index]}
                      >
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={conversion.factor}
                          onChange={(event) =>
                            updateConversion(
                              index,
                              "factor",
                              parseFloat(event.target.value) || 0,
                            )
                          }
                          className={inputClassName}
                        />
                      </Field>
                      <button
                        type="button"
                        onClick={() => removeConversion(index)}
                        aria-label="Remove conversion"
                        className="mb-0.5 rounded-md border border-border/80 p-1.5 text-text-muted transition-colors hover:border-error/30 hover:bg-error/5 hover:text-error"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className={sectionPanelClassName}>
            <SectionHeading>Inventory Weight</SectionHeading>
            <label className="flex cursor-pointer items-center gap-2.5 rounded-md border border-border/80 bg-surface px-2.5 py-2 text-xs text-text-secondary shadow-sm transition-colors hover:border-text-muted/30 has-[:checked]:border-accent/40 has-[:checked]:bg-accent/5 has-[:checked]:text-text-primary">
              <input
                type="checkbox"
                checked={values.useCustomWeights}
                onChange={(event) =>
                  updateField("useCustomWeights", event.target.checked)
                }
                className="size-3.5 rounded border-border accent-accent"
              />
              Custom tare/full weights
            </label>
            {values.useCustomWeights && (
              <div className="grid grid-cols-3 gap-2 rounded-md border border-border/60 bg-surface-muted/30 p-2">
                <Field label="Tare" error={errors.weights}>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={values.weights.tareWeight}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        weights: {
                          ...current.weights,
                          tareWeight: parseFloat(event.target.value) || 0,
                        },
                      }))
                    }
                    className={inputClassName}
                  />
                </Field>
                <Field label="Full">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={values.weights.fullWeight}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        weights: {
                          ...current.weights,
                          fullWeight: parseFloat(event.target.value) || 0,
                        },
                      }))
                    }
                    className={inputClassName}
                  />
                </Field>
                <Field label="Unit">
                  <SelectInput>
                    <select
                      value={values.weights.weightUnit}
                      onChange={(event) =>
                        setValues((current) => ({
                          ...current,
                          weights: {
                            ...current.weights,
                            weightUnit: event.target.value,
                          },
                        }))
                      }
                      className={selectClassName}
                    >
                      {WEIGHT_UNITS.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </SelectInput>
                </Field>
              </div>
            )}

            <div className="mt-1 border-t border-border/60 pt-2.5">
              <SectionHeading>Records</SectionHeading>
              <div className="mt-2 grid gap-2">
                <Field label="GL Code" error={errors.glCode}>
                  <input
                    type="text"
                    value={values.glCode}
                    onChange={(event) => updateField("glCode", event.target.value)}
                    className={inputClassName}
                  />
                </Field>
                <Field label="Notes">
                  <textarea
                    rows={2}
                    value={values.notes}
                    onChange={(event) => updateField("notes", event.target.value)}
                    className={inputClassName}
                  />
                </Field>
              </div>
            </div>
          </section>
        </div>
      </form>
    </Modal>
  );
}
