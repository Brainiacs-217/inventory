import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

export const recipeInputClassName =
  "w-full rounded-sm border border-border/80 bg-surface px-2.5 py-1.5 text-sm text-text-primary shadow-sm transition-[border-color,box-shadow] outline-none placeholder:text-text-muted/60 hover:border-text-muted/30 focus:border-accent/50 focus:ring-2 focus:ring-accent/15 max-md:min-h-11 max-md:text-base";

export const recipeSelectClassName = `${recipeInputClassName} appearance-none pr-8`;

export const recipeLabelClassName =
  "text-[10px] font-medium uppercase tracking-[0.14em] text-text-muted";

export const recipeSectionRowClassName = "grid grid-cols-2 gap-3";

export const recipeFieldGridClassName = "grid grid-cols-2 gap-x-3 gap-y-2.5";

type FieldProps = {
  id?: string;
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
  className?: string;
  hint?: string;
};

export function RecipeField({
  id,
  label,
  required,
  error,
  children,
  className,
  hint,
}: FieldProps) {
  return (
    <div id={id} className={`flex min-w-0 scroll-my-4 flex-col gap-1 ${className ?? ""}`}>
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
      className={`flex flex-col gap-3 md:h-full md:gap-0 md:overflow-hidden md:rounded-sm md:border md:border-border/80 md:bg-surface ${className ?? ""}`}
    >
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
