"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

type ModalSize = "md" | "lg" | "xl";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  bodyClassName?: string;
  mobileSheet?: boolean;
};

const sizeClassNames: Record<ModalSize, string> = {
  md: "max-w-2xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  bodyClassName,
  mobileSheet = false,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open || !mobileSheet) return;

    const viewport = window.visualViewport;
    const panel = panelRef.current;
    const narrow = window.matchMedia("(max-width: 767px)");
    if (!viewport || !panel) return;

    function fitSheetToVisibleScreen() {
      if (!viewport || !panel) return;
      if (!narrow.matches) {
        panel.style.height = "";
        panel.style.top = "";
        return;
      }
      panel.style.height = `${viewport.height}px`;
      panel.style.top = `${viewport.offsetTop}px`;
    }

    fitSheetToVisibleScreen();
    viewport.addEventListener("resize", fitSheetToVisibleScreen);
    viewport.addEventListener("scroll", fitSheetToVisibleScreen);
    narrow.addEventListener("change", fitSheetToVisibleScreen);

    return () => {
      viewport.removeEventListener("resize", fitSheetToVisibleScreen);
      viewport.removeEventListener("scroll", fitSheetToVisibleScreen);
      narrow.removeEventListener("change", fitSheetToVisibleScreen);
      panel.style.height = "";
      panel.style.top = "";
    };
  }, [open, mobileSheet]);

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;

    const panel = panelRef.current;
    if (panel) {
      const focusable = panel.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      focusable?.focus();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      previousFocusRef.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex ${
        mobileSheet
          ? "items-stretch justify-center md:items-center md:p-4"
          : "items-center justify-center p-4"
      }`}
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-foreground/25 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`flex w-full ${sizeClassNames[size]} flex-col overflow-hidden bg-surface ${
          mobileSheet
            ? "absolute inset-x-0 top-0 h-dvh max-h-none rounded-none border-0 shadow-none md:relative md:h-auto md:max-h-[92vh] md:rounded-xl md:border md:border-border/80 md:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.18)]"
            : "relative max-h-[92vh] rounded-xl border border-border/80 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.18)]"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className={`shrink-0 border-b border-border/80 bg-surface-muted/40 ${
            mobileSheet
              ? "grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center pr-[max(1rem,env(safe-area-inset-right))] pb-3.5 pl-[max(1rem,env(safe-area-inset-left))] pt-[calc(0.875rem+env(safe-area-inset-top))] md:flex md:items-start md:justify-between md:gap-4 md:px-5 md:py-3.5"
              : "flex items-start justify-between gap-4 px-5 py-3.5"
          }`}
        >
          {mobileSheet ? <div className="md:hidden" aria-hidden /> : null}
          <div className={`min-w-0 ${mobileSheet ? "text-center md:text-left" : ""}`}>
            <h2
              id="modal-title"
              className="text-base font-semibold tracking-tight text-text-primary"
            >
              {title}
            </h2>
            {description && (
              <p className="mt-0.5 text-xs text-text-muted">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={`shrink-0 rounded-md text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary ${
              mobileSheet
                ? "flex size-11 items-center justify-center justify-self-end md:size-auto md:justify-self-auto md:p-1.5"
                : "p-1.5"
            }`}
          >
            <X className="size-4" />
          </button>
        </div>

        <div
          className={`min-h-0 flex-1 bg-background/50 ${
            mobileSheet
              ? "pr-[max(1rem,env(safe-area-inset-right))] pl-[max(1rem,env(safe-area-inset-left))] md:px-5"
              : "px-5"
          } py-4 ${bodyClassName ?? "overflow-y-auto"}`}
        >
          {children}
        </div>

        {footer && (
          <div
            className={`shrink-0 border-t border-border/80 bg-surface-muted/30 ${
              mobileSheet
                ? "pr-[max(1rem,env(safe-area-inset-right))] pb-[calc(0.875rem+env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] pt-3.5 md:px-5 md:py-3.5"
                : "px-5 py-3.5"
            }`}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
