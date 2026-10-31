"use client";

import { useEffect, useRef, useState } from "react";

import { recipeInputClassName } from "@/component/recipe/formShared";
import { searchSquareItems } from "@/lib/square/items";
import type { LinkedSquareItem, SquareItemMatch } from "@/types/recipe";

type RecipeSquareLinksProps = {
  organizationId: string;
  recipeId: string;
  recipeName: string;
  linkedItems: LinkedSquareItem[];
  onAdd: (item: SquareItemMatch) => void;
  onRemove: (id: string) => void;
};

export function RecipeSquareLinks({
  organizationId,
  recipeId,
  recipeName,
  linkedItems,
  onAdd,
  onRemove,
}: RecipeSquareLinksProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SquareItemMatch[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const requestRef = useRef(0);
  const linkedIds = new Set(linkedItems.map((item) => item.id));
  const visibleResults = results.filter((item) => !linkedIds.has(item.id));

  useEffect(() => {
    const term = query.trim() || recipeName.trim();
    if (term.length < 2) {
      setResults([]);
      setSearching(false);
      setSearchError(null);
      return;
    }

    const requestId = ++requestRef.current;
    setSearching(true);
    const timer = window.setTimeout(() => {
      void searchSquareItems(organizationId, term).then((result) => {
        if (requestRef.current !== requestId) return;
        setSearching(false);
        if ("error" in result) {
          setSearchError(result.error);
          setResults([]);
          return;
        }
        setSearchError(null);
        setResults(result.data);
      });
    }, query.trim() ? 200 : 0);

    return () => window.clearTimeout(timer);
  }, [organizationId, query, recipeName]);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm leading-snug text-text-muted">
        Search the Square menu and add the products that sell this recipe.
      </p>

      {linkedItems.length === 0 ? (
        <p className="rounded-sm border border-dashed border-border/80 px-3 py-4 text-center text-sm text-text-muted">
          No Square items linked yet.
        </p>
      ) : (
        <ul className="divide-y divide-border/60 overflow-hidden rounded-sm border border-border/80">
          {linkedItems.map((item) => (
            <li key={item.id} className="flex items-center gap-3 px-3 py-2.5">
              <span className="min-w-0 flex-1 truncate text-base font-medium text-text-primary">
                {item.name}
              </span>
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="shrink-0 text-sm font-medium text-text-muted"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.preventDefault();
        }}
        placeholder={`Search for ${recipeName}`}
        aria-label="Search Square items"
        autoComplete="off"
        className={recipeInputClassName}
      />

      {searchError ? <p className="text-xs text-error">{searchError}</p> : null}
      {searching ? <p className="text-sm text-text-muted">Searching…</p> : null}

      {visibleResults.length > 0 ? (
        <ul className="divide-y divide-border/60 overflow-hidden rounded-sm border border-border/80">
          {visibleResults.map((item) => {
            const linkedElsewhere = item.recipeId != null && item.recipeId !== recipeId;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onAdd(item)}
                  className="flex min-h-11 w-full flex-col items-start justify-center px-3 py-2 text-left"
                >
                  <span className="text-base text-text-primary">{item.name}</span>
                  {linkedElsewhere && item.recipeName ? (
                    <span className="text-xs text-text-muted">
                      Currently linked to {item.recipeName}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
