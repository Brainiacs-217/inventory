"use client";

import { Check, ImagePlus, Plug, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { Modal } from "@/component/Modal";
import { connectSandboxSquare, type SquareConnectOptions } from "@/lib/square/actions";
import { SQUARE_OAUTH_NEXT_CREATE_ORG } from "@/lib/square/constants";
import {
  createEmptyOrganizationFormValues,
  type CreateOrganizationFormValues,
} from "@/types/organization";

export type CreateOrganizationResume = {
  organizationId: string;
  name: string;
  logoSrc?: string;
  squareConnected: boolean;
  merchantId: string | null;
  squareError: string | null;
};

type CreateOrganizationModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (
    values: CreateOrganizationFormValues,
  ) => Promise<{ organizationId: string }>;
  onAttachLogo: (organizationId: string, file: File) => Promise<void>;
  squareOptions: SquareConnectOptions | null;
  resume?: CreateOrganizationResume | null;
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
  onAttachLogo,
  squareOptions,
  resume = null,
}: CreateOrganizationModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const savedLogoFileRef = useRef<File | null>(null);
  const createdOrganizationIdRef = useRef<string | null>(null);
  const [values, setValues] = useState<CreateOrganizationFormValues>(
    createEmptyOrganizationFormValues(),
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [squareError, setSquareError] = useState<string | null>(null);
  const [createdOrganizationId, setCreatedOrganizationId] = useState<string | null>(
    null,
  );
  const [squareConnected, setSquareConnected] = useState(false);
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [gustoConnected, setGustoConnected] = useState(false);

  const connectAvailable = Boolean(
    squareOptions?.oauthEnabled || squareOptions?.sandboxConnectEnabled,
  );
  const busy = saving || connecting;

  useEffect(() => {
    if (!open) return;

    if (resume) {
      savedLogoFileRef.current = null;
      createdOrganizationIdRef.current = resume.organizationId;
      setValues({
        ...createEmptyOrganizationFormValues(),
        name: resume.name,
        logoSrc: resume.logoSrc ?? null,
      });
      setErrors({});
      setSaving(false);
      setConnecting(false);
      setSubmitError(null);
      setSquareError(resume.squareError);
      setCreatedOrganizationId(resume.organizationId);
      setSquareConnected(resume.squareConnected);
      setMerchantId(resume.merchantId);
      setGustoConnected(false);
      return;
    }

    savedLogoFileRef.current = null;
    createdOrganizationIdRef.current = null;
    setValues(createEmptyOrganizationFormValues());
    setErrors({});
    setSaving(false);
    setConnecting(false);
    setSubmitError(null);
    setSquareError(null);
    setCreatedOrganizationId(null);
    setSquareConnected(false);
    setMerchantId(null);
    setGustoConnected(false);
  }, [open, resume]);

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
      setValues((current) => ({
        ...current,
        logoSrc,
        logoFile: file,
      }));
      setErrors((current) => {
        const next = { ...current };
        delete next.logoSrc;
        return next;
      });
    } catch {
      setErrors((current) => ({
        ...current,
        logoSrc: "Could not read logo file.",
      }));
    }
  }

  function handleRemoveLogo() {
    setValues((current) => ({
      ...current,
      logoSrc: null,
      logoFile: null,
    }));
  }

  async function ensureOrganization(): Promise<string> {
    if (createdOrganizationIdRef.current) {
      return createdOrganizationIdRef.current;
    }

    const { organizationId } = await onSave(values);
    createdOrganizationIdRef.current = organizationId;
    savedLogoFileRef.current = values.logoFile;
    setCreatedOrganizationId(organizationId);
    return organizationId;
  }

  async function finishAndClose(organizationId: string | null) {
    if (
      organizationId &&
      values.logoFile &&
      values.logoFile !== savedLogoFileRef.current
    ) {
      await onAttachLogo(organizationId, values.logoFile);
    }
    onClose();
  }

  async function handleConnectSquare() {
    const validationErrors = validateForm(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!squareOptions || !connectAvailable) {
      setSquareError("Square is not configured.");
      return;
    }

    setConnecting(true);
    setSquareError(null);
    setSubmitError(null);

    try {
      const organizationId = await ensureOrganization();

      if (squareOptions.oauthEnabled) {
        window.location.assign(
          `/api/square/oauth/connect?next=${SQUARE_OAUTH_NEXT_CREATE_ORG}`,
        );
        return;
      }

      const result = await connectSandboxSquare(organizationId);
      if ("error" in result) {
        setSquareError(result.error);
        return;
      }

      setMerchantId(result.merchantId);
      setSquareConnected(true);
    } catch (error) {
      setSquareError(
        error instanceof Error ? error.message : "Failed to connect Square.",
      );
    } finally {
      setConnecting(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (createdOrganizationId) {
      if (connectAvailable && !squareConnected) {
        setSquareError("Connect Square before finishing.");
        return;
      }

      setSaving(true);
      setSubmitError(null);
      try {
        await finishAndClose(createdOrganizationId);
      } catch (error) {
        setSubmitError(
          error instanceof Error ? error.message : "Failed to save organization.",
        );
      } finally {
        setSaving(false);
      }
      return;
    }

    const validationErrors = validateForm(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (connectAvailable && !squareConnected) {
      setSquareError("Connect Square before creating this organization.");
      return;
    }

    setSaving(true);
    setSubmitError(null);

    try {
      const { organizationId } = await onSave(values);
      savedLogoFileRef.current = values.logoFile;
      await finishAndClose(organizationId);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Failed to create organization.",
      );
    } finally {
      setSaving(false);
    }
  }

  const logoInitial = values.name.trim().charAt(0).toUpperCase() || "—";
  const squareStatus = squareConnected
    ? "Connected"
    : connecting
      ? "Connecting…"
      : "Not connected";
  const squareDetail = !squareOptions
    ? "Checking Square…"
    : squareConnected
      ? merchantId
        ? `Merchant ${merchantId} is linked to this organization.`
        : "This organization's Square account is linked."
      : connectAvailable
        ? "Link your Square account. Connecting saves this organization."
        : "Add Square credentials to link an account.";

  const footer = (
    <div className="flex flex-col gap-2">
      {submitError && <p className="text-xs text-error">{submitError}</p>}
      <div className="flex justify-end gap-2.5">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="rounded-sm border border-border/80 bg-surface px-3.5 py-1.5 text-sm font-medium text-text-secondary shadow-sm transition-colors hover:border-text-muted/30 hover:text-text-primary disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          form="create-organization-form"
          disabled={busy || !squareOptions}
          className="rounded-sm bg-accent px-3.5 py-1.5 text-sm font-medium text-text-primary shadow-sm transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {saving
            ? "Saving…"
            : createdOrganizationId
              ? "Done"
              : "Create organization"}
        </button>
      </div>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create organization"
      description="Add a new organization and link the Square account for it."
      footer={footer}
      size="md"
    >
      <form
        id="create-organization-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-5"
      >
        <Field label="Organization name" required error={errors.name}>
          <input
            type="text"
            placeholder="e.g. Downtown Kitchen"
            value={values.name}
            onChange={(event) => updateField("name", event.target.value)}
            className={inputClassName}
            autoFocus
            disabled={busy || createdOrganizationId != null}
          />
        </Field>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="order-2 flex min-w-0 flex-col gap-3 md:order-1">
          <div className="flex min-w-0 flex-col gap-1.5">
            <span className={labelClassName}>Square</span>
            <div
              title={squareDetail}
              className="flex h-10 items-center gap-2 rounded-sm border border-border/80 bg-surface px-2.5"
            >
              <div
                className={`flex size-6 shrink-0 items-center justify-center rounded-sm border border-border/80 ${
                  squareConnected ? "bg-success/10 text-success" : "bg-surface-muted text-text-muted"
                }`}
              >
                {squareConnected ? (
                  <Check aria-hidden className="size-3.5" strokeWidth={2} />
                ) : (
                  <Plug aria-hidden className="size-3.5" strokeWidth={1.75} />
                )}
              </div>
              <p className="min-w-0 flex-1 truncate text-sm font-medium tracking-tight text-text-primary">
                {squareStatus}
              </p>
              {squareConnected ? (
                <span className="shrink-0 text-xs font-medium text-success">Linked</span>
              ) : (
                <button
                  type="button"
                  onClick={handleConnectSquare}
                  disabled={busy || !squareOptions || !connectAvailable}
                  className="inline-flex shrink-0 items-center rounded-sm bg-accent px-2.5 py-1 text-xs font-medium text-text-primary shadow-sm transition-colors hover:bg-accent-hover disabled:opacity-50"
                >
                  {connecting ? "Connecting…" : "Connect"}
                </button>
              )}
            </div>
            {squareError && <p className="text-xs text-error">{squareError}</p>}
          </div>

          <div className="flex min-w-0 flex-col gap-1.5">
            <span className={labelClassName}>Gusto</span>
            <div className="flex h-10 items-center gap-2 rounded-sm border border-border/80 bg-surface px-2.5">
              <div
                className={`flex size-6 shrink-0 items-center justify-center rounded-sm border border-border/80 ${
                  gustoConnected ? "bg-success/10 text-success" : "bg-surface-muted text-text-muted"
                }`}
              >
                {gustoConnected ? (
                  <Check aria-hidden className="size-3.5" strokeWidth={2} />
                ) : (
                  <Plug aria-hidden className="size-3.5" strokeWidth={1.75} />
                )}
              </div>
              <p className="min-w-0 flex-1 truncate text-sm font-medium tracking-tight text-text-primary">
                {gustoConnected ? "Connected" : "Not connected"}
              </p>
              {gustoConnected ? (
                <span className="shrink-0 text-xs font-medium text-success">Linked</span>
              ) : (
                <button
                  type="button"
                  onClick={() => setGustoConnected(true)}
                  disabled={busy}
                  className="inline-flex shrink-0 items-center rounded-sm bg-accent px-2.5 py-1 text-xs font-medium text-text-primary shadow-sm transition-colors hover:bg-accent-hover disabled:opacity-50"
                >
                  Connect
                </button>
              )}
            </div>
          </div>
          </div>

          <div className="order-1 flex min-w-0 flex-col gap-1.5 md:order-2">
            <span className={labelClassName}>Logo</span>
            <div
              title="Square image recommended. PNG, JPG, WebP, or SVG. Max 2 MB."
              className="flex h-10 items-center gap-2 rounded-sm border border-border/80 bg-surface px-2.5"
            >
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label={values.logoSrc ? "Change logo" : "Upload logo"}
                disabled={busy}
                className="flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-border/80 bg-surface-muted/40 transition-colors hover:bg-surface-muted/70 disabled:opacity-50"
              >
                {values.logoSrc ? (
                  <img src={values.logoSrc} alt="" className="size-5 object-contain" />
                ) : (
                  <span className="text-[11px] font-medium tracking-tight text-text-muted/70">
                    {logoInitial}
                  </span>
                )}
              </button>
              <p className="min-w-0 flex-1 truncate text-sm font-medium tracking-tight text-text-primary">
                {values.logoSrc ? "Logo selected" : "Optional"}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_LOGO_TYPES.join(",")}
                onChange={handleLogoChange}
                className="sr-only"
                disabled={busy}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={busy}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-sm border border-border/80 bg-surface px-2.5 py-1 text-xs font-medium text-text-secondary transition-colors hover:border-text-muted/30 hover:text-text-primary disabled:opacity-50"
              >
                <ImagePlus aria-hidden className="size-3.5" strokeWidth={1.75} />
                {values.logoSrc ? "Replace" : "Choose file"}
              </button>
              {values.logoSrc && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  disabled={busy}
                  aria-label="Remove logo"
                  className="inline-flex size-7 shrink-0 items-center justify-center rounded-sm border border-border/80 text-text-muted transition-colors hover:border-text-muted/30 hover:text-text-primary disabled:opacity-50"
                >
                  <X aria-hidden className="size-3.5" />
                </button>
              )}
            </div>
            {errors.logoSrc && <p className="text-xs text-error">{errors.logoSrc}</p>}
          </div>
        </div>
      </form>
    </Modal>
  );
}
