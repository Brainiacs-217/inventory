"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
  const panelRef = useRef<HTMLDivElement>(null);
  const active = fields.some((field) => field.value !== "");

  function close() {
    setOpen(false);
  }

  function clearAll() {
    for (const field of fields) {
      field.onChange("");
    }
  }

  useEffect(() => {
    if (!open) return;

    const panel = panelRef.current;
    panel
      ?.querySelector<HTMLElement>("select, button")
      ?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

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
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <button
            type="button"
            aria-label="Close dialog"
            className="absolute inset-0 bg-foreground/25"
            onClick={close}
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="list-filter-title"
            className="sheet-rise app-safe-bottom relative flex max-h-[85dvh] w-full flex-col rounded-t-2xl border-x-0 border-b-0 border-t border-border/80 bg-surface shadow-[0_-12px_40px_-12px_rgba(0,0,0,0.18)]"
          >
            <div className="flex items-start justify-between gap-3 border-b border-border/80 px-4 py-3.5">
              <h2
                id="list-filter-title"
                className="min-w-0 truncate text-base font-semibold text-text-primary"
              >
                Filter
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="shrink-0 rounded-md p-1.5 text-text-muted hover:bg-surface-muted hover:text-text-primary"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="overflow-y-auto px-4 py-4">
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
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
