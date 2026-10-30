"use client";

import { Plus, Search, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { ListFilterButton } from "@/component/ListFilterButton";
import { formatOptionalCurrency } from "@/lib/formatCurrency";
import type { Recipe } from "@/types/recipe";

const SEARCH_INPUT_CLASS =
  "w-full rounded-md border border-border/80 bg-surface py-2 pl-9 pr-3 text-sm text-text-primary shadow-sm outline-none placeholder:text-text-muted/60 transition-[border-color,box-shadow] hover:border-text-muted/30 focus:border-accent/50 focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-50";

type RecipesMobileListProps = {
  organizationId: string | null;
  searchQuery: string;
  onSearchQuery: (value: string) => void;
  itemFilter: string;
  onItemFilter: (value: string) => void;
  visibleRecipes: Recipe[];
  totalCount: number;
  isFiltering: boolean;
  selectedIds: Set<string>;
  allSelected: boolean;
  onToggleRecipe: (id: string) => void;
  onToggleSelectAll: () => void;
  onClearSelection: () => void;
  onRequestDelete: (ids: string[], prompt: string) => void;
  onAdd: () => void;
  onEdit: (recipe: Recipe) => void;
};

function itemLabel(count: number): string {
  return count === 1 ? "1 item" : `${count} items`;
}

export function RecipesMobileList({
  organizationId,
  searchQuery,
  onSearchQuery,
  itemFilter,
  onItemFilter,
  visibleRecipes,
  totalCount,
  isFiltering,
  selectedIds,
  allSelected,
  onToggleRecipe,
  onToggleSelectAll,
  onClearSelection,
  onRequestDelete,
  onAdd,
  onEdit,
}: RecipesMobileListProps) {
  const [selecting, setSelecting] = useState(false);
  const [openRecipe, setOpenRecipe] = useState<Recipe | null>(null);
  const visibleSelectedIds = visibleRecipes
    .filter((recipe) => selectedIds.has(recipe.id))
    .map((recipe) => recipe.id);

  function exitSelecting() {
    setSelecting(false);
    onClearSelection();
  }

  function openDelete(ids: string[], prompt: string) {
    setOpenRecipe(null);
    onRequestDelete(ids, prompt);
  }

  const selectedCount = visibleSelectedIds.length;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden md:hidden">
      <div className="shrink-0 pb-3">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-text-muted"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => onSearchQuery(event.target.value)}
              placeholder="Search recipes…"
              disabled={!organizationId}
              aria-label="Search recipes"
              className={SEARCH_INPUT_CLASS}
            />
          </div>
          <ListFilterButton
            disabled={!organizationId}
            fields={[
              {
                fieldLabel: "Items",
                value: itemFilter,
                onChange: onItemFilter,
                allLabel: "All recipes",
                options: [
                  { value: "with", label: "With items" },
                  { value: "empty", label: "No items" },
                ],
              },
            ]}
          />
        </div>
      </div>

      <FaintScroller>
        {visibleRecipes.length === 0 ? (
          <p className="px-2 py-10 text-center text-sm text-text-muted">
            {organizationId
              ? isFiltering && totalCount > 0
                ? "No recipes match your filters."
                : "No recipes yet. Add your first recipe to get started."
              : "Select an organization in the sidebar to manage recipes."}
          </p>
        ) : (
          <ul>
            {visibleRecipes.map((recipe) => {
              const selected = selectedIds.has(recipe.id);
              return (
                <li key={recipe.id} className="border-b border-border/60">
                  <button
                    type="button"
                    onClick={() =>
                      selecting ? onToggleRecipe(recipe.id) : setOpenRecipe(recipe)
                    }
                    aria-pressed={selecting ? selected : undefined}
                    className={`flex w-full items-center gap-3 py-2 pr-3 text-left ${
                      selected ? "bg-surface-muted/50" : ""
                    }`}
                  >
                    {selecting ? (
                      <span
                        aria-hidden
                        className={`size-4 shrink-0 rounded border ${
                          selected
                            ? "border-accent bg-accent"
                            : "border-border/80 bg-surface"
                        }`}
                      />
                    ) : null}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base font-medium text-text-primary">
                        {recipe.name}
                      </span>
                      <span className="mt-0.5 block truncate text-[13px] font-normal leading-5 text-text-muted">
                        {itemLabel(recipe.ingredientCount)}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                        COG
                      </span>
                      <span className="text-[13px] font-medium text-text-primary tabular-nums">
                        {formatOptionalCurrency(recipe.cog)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </FaintScroller>

      <div className="shrink-0 pt-6">
        {selecting ? (
          <button
            type="button"
            onClick={onToggleSelectAll}
            disabled={visibleRecipes.length === 0}
            className="mb-2 text-sm font-medium text-text-secondary disabled:opacity-50"
          >
            {allSelected ? "Clear selection" : "Select all"}
          </button>
        ) : null}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => (selecting ? exitSelecting() : setSelecting(true))}
            disabled={!organizationId}
            className="inline-flex items-center justify-center rounded-md border border-border/80 bg-surface px-3 py-2.5 text-sm font-medium text-text-secondary shadow-sm transition-colors hover:border-text-muted/30 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {selecting ? "Done" : "Select"}
          </button>
          {selecting ? (
            <button
              type="button"
              onClick={() =>
                openDelete(
                  visibleSelectedIds,
                  selectedCount === 1
                    ? "Are you sure you want to delete 1 selected recipe?"
                    : `Are you sure you want to delete ${selectedCount} selected recipes?`,
                )
              }
              disabled={selectedCount === 0 || !organizationId}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-error px-3 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-error/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {selectedCount > 0 ? `Delete ${selectedCount}` : "Delete"}
            </button>
          ) : (
            <button
              type="button"
              onClick={onAdd}
              disabled={!organizationId}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-accent px-3 py-2.5 text-sm font-medium text-text-primary shadow-sm transition-[background-color,box-shadow] hover:bg-accent-hover hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="size-4" strokeWidth={2} />
              Add recipe
            </button>
          )}
        </div>
      </div>

      <MobileSheet
        open={openRecipe != null}
        title={openRecipe?.name ?? "Recipe"}
        onClose={() => setOpenRecipe(null)}
        footer={
          openRecipe ? (
            <button
              type="button"
              disabled={!organizationId}
              onClick={() => {
                if (!openRecipe) return;
                const recipe = openRecipe;
                setOpenRecipe(null);
                onEdit(recipe);
              }}
              className="inline-flex w-full items-center justify-center rounded-md bg-accent px-3 py-2.5 text-sm font-medium text-text-primary shadow-sm transition-[background-color,box-shadow] hover:bg-accent-hover hover:shadow disabled:opacity-50"
            >
              Edit
            </button>
          ) : null
        }
      >
        {openRecipe ? (
          <dl className="flex flex-col">
            <DetailRow label="Items" value={itemLabel(openRecipe.ingredientCount)} />
            <DetailRow
              label="COG"
              value={formatOptionalCurrency(openRecipe.cog)}
            />
          </dl>
        ) : null}
      </MobileSheet>
    </div>
  );
}

function FaintScroller({ children }: { children: ReactNode }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef(0);
  const [thumb, setThumb] = useState({ top: 0, height: 0, show: false });

  const measure = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const { scrollTop, scrollHeight, clientHeight } = scroller;
    const overflow = scrollHeight - clientHeight;
    if (overflow <= 1 || clientHeight <= 0) {
      setThumb((current) =>
        current.show ? { top: 0, height: 0, show: false } : current,
      );
      return;
    }

    const height = Math.max(28, (clientHeight / scrollHeight) * clientHeight);
    const top = (scrollTop / overflow) * (clientHeight - height);
    setThumb((current) => {
      if (
        current.show &&
        Math.abs(current.top - top) < 0.5 &&
        Math.abs(current.height - height) < 0.5
      ) {
        return current;
      }
      return { top, height, show: true };
    });
  }, []);

  useEffect(() => {
    measure();
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const observer = new ResizeObserver(measure);
    observer.observe(scroller);
    if (scroller.firstElementChild instanceof Element) {
      observer.observe(scroller.firstElementChild);
    }

    return () => observer.disconnect();
  }, [measure, children]);

  useEffect(() => {
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={scrollerRef}
        onScroll={() => {
          cancelAnimationFrame(frameRef.current);
          frameRef.current = requestAnimationFrame(measure);
        }}
        className="scrollbar-hidden h-full overflow-y-auto overscroll-none"
      >
        {children}
      </div>
      {thumb.show ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-2"
        >
          <div className="absolute inset-y-0 right-0.5 w-1 rounded-full bg-border" />
          <div
            className="absolute right-0.5 w-1 rounded-full bg-text-muted/55"
            style={{ height: thumb.height, transform: `translateY(${thumb.top}px)` }}
          />
        </div>
      ) : null}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/60 py-2.5 last:border-b-0">
      <dt className="text-sm text-text-muted">{label}</dt>
      <dd className="min-w-0 truncate text-right text-sm font-medium text-text-primary">
        {value}
      </dd>
    </div>
  );
}

function MobileSheet({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-foreground/25"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="recipe-sheet-title"
        className="sheet-rise app-safe-bottom relative flex max-h-[85dvh] w-full flex-col rounded-t-2xl border border-border/80 bg-surface"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border/80 px-4 py-3.5">
          <h2
            id="recipe-sheet-title"
            className="min-w-0 truncate text-base font-semibold text-text-primary"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-md p-1.5 text-text-muted hover:bg-surface-muted hover:text-text-primary"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-3">{children}</div>
        {footer ? (
          <div className="border-t border-border/80 px-4 py-3">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
