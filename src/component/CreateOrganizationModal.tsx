"use client";

import { ImagePlus, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { Modal } from "@/component/Modal";
import {
  createEmptyOrganizationFormValues,
  type CreateOrganizationFormValues,
} from "@/types/organization";

type CreateOrganizationModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (values: CreateOrganizationFormValues) => void;
};

type FormErrors = Partial<Record<keyof CreateOrganizationFormValues, string>>;

const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024;
const ACCEPTED_LOGO_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
];

const inputClassName =
  "rounded-sm border border-border/80 bg-surface px-2.5 py-1.5 text-sm text-text-primary shadow-sm transition-[border-color,box-shadow] outline-none placeholder:text-text-muted/60 hover:border-text-muted/30 focus:border-accent/50 focus:ring-2 focus:ring-accent/15 w-full";
const labelClassName =
  "text-[10px] font-medium uppercase tracking-[0.14em] text-text-muted";

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className={labelClassName}>
        {label}
        {required && <span className="text-error"> *</span>}
      </label>
      {children}
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}

function validateForm(values: CreateOrganizationFormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.name.trim()) {
    errors.name = "Organization name is required.";
  }

  return errors;
}

function readLogoFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Could not read logo file."));
    };
    reader.onerror = () => reject(new Error("Could not read logo file."));
    reader.readAsDataURL(file);
  });
}

export function CreateOrganizationModal({
  open,
  onClose,
  onSave,
}: CreateOrganizationModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState<CreateOrganizationFormValues>(
    createEmptyOrganizationFormValues(),
  );
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!open) return;
    setValues(createEmptyOrganizationFormValues());
    setErrors({});
  }, [open]);

  function updateField<K extends keyof CreateOrganizationFormValues>(
    key: K,
    value: CreateOrganizationFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  async function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!ACCEPTED_LOGO_TYPES.includes(file.type)) {
      setErrors((current) => ({
        ...current,
        logoSrc: "Logo must be a PNG, JPG, WebP, or SVG file.",
      }));
      return;
    }

    if (file.size > MAX_LOGO_SIZE_BYTES) {
      setErrors((current) => ({
        ...current,
        logoSrc: "Logo must be 2 MB or smaller.",
      }));
      return;
    }

    try {
      const logoSrc = await readLogoFile(file);
      updateField("logoSrc", logoSrc);
    } catch {
      setErrors((current) => ({
        ...current,
        logoSrc: "Could not read logo file.",
      }));
    }
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

  const logoInitial = values.name.trim().charAt(0).toUpperCase() || "—";

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
        form="create-organization-form"
        className="rounded-sm bg-accent px-3.5 py-1.5 text-sm font-medium text-text-primary shadow-sm transition-colors hover:bg-accent-hover"
      >
        Create organization
      </button>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create organization"
      description="Add a new organization to your account."
      footer={footer}
      size="md"
    >
      <form
        id="create-organization-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-6"
      >
        <Field label="Organization name" required error={errors.name}>
          <input
            type="text"
            placeholder="e.g. Downtown Kitchen"
            value={values.name}
            onChange={(event) => updateField("name", event.target.value)}
            className={inputClassName}
            autoFocus
          />
        </Field>

        <div className="flex flex-col gap-1.5">
          <span className={labelClassName}>Logo</span>

          <div className="overflow-hidden rounded-sm border border-border/80 bg-surface">
            <div className="grid grid-cols-[5.5rem_1fr] items-stretch sm:grid-cols-[6.5rem_1fr]">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label={values.logoSrc ? "Change logo" : "Upload logo"}
                className="group relative flex h-full min-h-full items-center justify-center self-stretch border-r border-border/80 bg-surface-muted/40 transition-colors hover:bg-surface-muted/70"
              >
                {values.logoSrc ? (
                  <img
                    src={values.logoSrc}
                    alt=""
                    className="h-[70%] w-[70%] object-contain"
                  />
                ) : (
                  <span className="text-xl font-medium tracking-tight text-text-muted/70 transition-colors group-hover:text-text-muted">
                    {logoInitial}
                  </span>
                )}
                <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-foreground/0 px-1 py-1.5 text-center text-[9px] font-medium uppercase tracking-[0.12em] text-transparent transition-colors group-hover:bg-foreground/5 group-hover:text-text-muted">
                  {values.logoSrc ? "Change" : "Upload"}
                </span>
              </button>

              <div className="flex min-w-0 flex-col">
                <div className="flex flex-1 flex-col justify-center gap-0.5 px-4 py-3">
                  <p className="text-sm font-medium tracking-tight text-text-primary">
                    {values.logoSrc ? "Logo selected" : "Optional mark"}
                  </p>
                  <p className="text-xs leading-relaxed text-text-muted">
                    Square image recommended. Appears in the sidebar and org
                    switcher.
                  </p>
                </div>

                <div className="grid grid-cols-[1fr_auto] items-end gap-3 border-t border-border/80 px-4 py-3">
                  <p className="text-[11px] leading-relaxed text-text-muted">
                    PNG · JPG · WebP · SVG
                    <br />
                    Max 2 MB
                  </p>

                  <div className="flex shrink-0 items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={ACCEPTED_LOGO_TYPES.join(",")}
                      onChange={handleLogoChange}
                      className="sr-only"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 rounded-sm border border-border/80 bg-surface px-2.5 py-1 text-xs font-medium text-text-secondary transition-colors hover:border-text-muted/30 hover:text-text-primary"
                    >
                      <ImagePlus aria-hidden className="size-3.5" strokeWidth={1.75} />
                      {values.logoSrc ? "Replace" : "Choose file"}
                    </button>
                    {values.logoSrc && (
                      <button
                        type="button"
                        onClick={() => updateField("logoSrc", null)}
                        aria-label="Remove logo"
                        className="inline-flex size-7 items-center justify-center rounded-sm border border-border/80 text-text-muted transition-colors hover:border-text-muted/30 hover:text-text-primary"
                      >
                        <X aria-hidden className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {errors.logoSrc && (
            <p className="text-xs text-error">{errors.logoSrc}</p>
          )}
        </div>
      </form>
    </Modal>
  );
}
