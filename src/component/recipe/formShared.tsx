import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

export const recipeInputClassName =
  "rounded-sm border border-border/80 bg-surface px-2.5 py-1 text-sm text-text-primary shadow-sm transition-[border-color,box-shadow] outline-none placeholder:text-text-muted/60 hover:border-text-muted/30 focus:border-accent/50 focus:ring-2 focus:ring-accent/15 w-full";

export const recipeSelectClassName = `${recipeInputClassName} appearance-none pr-8`;

export const recipeLabelClassName =
  "text-[10px] font-medium uppercase tracking-[0.14em] text-text-muted";

export const recipeSectionRowClassName = "grid grid-cols-2 gap-3";

export const recipeFieldGridClassName = "grid grid-cols-2 gap-x-3 gap-y-2.5";

type FieldProps = {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
  className?: string;
  hint?: string;
};

export function RecipeField({
  label,
  required,
  error,
  children,
  className,
  hint,
}: FieldProps) {
  return (
    <div className={`flex flex-col gap-1 ${className ?? ""}`}>
      <label className={recipeLabelClassName}>
        {label}
        {required && <span className="text-error"> *</span>}
      </label>
      {children}
      {hint && !error ? (
        <p className="text-[10px] leading-tight text-text-muted">{hint}</p>
      ) : null}
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}

export function RecipeSelectInput({
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

export function RecipeFormSection({
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
      <div className="flex min-h-0 flex-1 flex-col p-3">{children}</div>
    </section>
  );
}
