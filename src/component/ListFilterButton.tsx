"use client";

import { useState } from "react";

import { Modal } from "@/component/Modal";

export type ListFilterOption = {
  value: string;
  label: string;
};

export type ListFilterField = {
  fieldLabel: string;
  value: string;
  onChange: (value: string) => void;
  allLabel: string;
  options: ListFilterOption[];
};

type ListFilterButtonProps = {
  fields: ListFilterField[];
  disabled?: boolean;
};

const SELECT_CLASS =
  "w-full appearance-none rounded-md border border-border/80 bg-surface px-3 py-2 text-sm text-text-primary shadow-sm outline-none";

export function ListFilterButton({
  fields,
  disabled = false,
}: ListFilterButtonProps) {
  const [open, setOpen] = useState(false);
  const active = fields.some((field) => field.value !== "");

  function clearAll() {
    for (const field of fields) {
      field.onChange("");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`shrink-0 rounded-md border px-3 py-2 text-sm font-medium shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          active
            ? "border-accent/40 bg-sidebar-active text-text-primary"
            : "border-border/80 bg-surface text-text-secondary hover:border-text-muted/30 hover:text-text-primary"
        }`}
      >
        Filter
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Filter">
        <div className="flex flex-col gap-4">
          {fields.map((field) => (
            <label
              key={field.fieldLabel}
              className="flex flex-col gap-1.5 text-sm text-text-secondary"
            >
              {field.fieldLabel}
              <select
                value={field.value}
                onChange={(event) => field.onChange(event.target.value)}
                aria-label={`Filter by ${field.fieldLabel.toLowerCase()}`}
                className={SELECT_CLASS}
              >
                <option value="">{field.allLabel}</option>
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        {active ? (
          <button
            type="button"
            onClick={clearAll}
            className="mt-3 text-sm font-medium text-text-secondary"
          >
            Clear
          </button>
        ) : null}
      </Modal>
    </>
  );
}
