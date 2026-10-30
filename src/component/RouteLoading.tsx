import type { CSSProperties } from "react";

import type { ListRoute } from "@/lib/routes";

const CARD_CLASS =
  "flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/80 bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-4px_rgba(0,0,0,0.08)]";

const ROW_WIDTHS = ["68%", "46%", "58%", "40%", "72%", "52%", "63%", "44%"];

const LIST_COPY = {
  items: {
    label: "Loading items",
    search: "Search items…",
    sections: ["Beverage", "Food", "Supply"],
    headers: ["Name", "Reporting Unit", "Cost", "SKU", "Category", "Vendor"],
  },
  batches: {
    label: "Loading batches",
    search: "Search batches…",
    sections: null,
    headers: ["Name", "Yield", "Items", "Price", "Created"],
  },
  recipes: {
    label: "Loading recipes",
    search: "Search recipes…",
    sections: null,
    headers: ["Name", "Items", "COG"],
  },
} as const;

function Shimmer({
  className,
  style,
}: {
  className: string;
  style?: CSSProperties;
}) {
  return <span className={`skeleton-shimmer block ${className}`} style={style} />;
}

function ItemRows({
  headers,
  mobile,
}: {
  headers: readonly string[];
  mobile?: boolean;
}) {
  if (mobile) {
    return (
      <ul className="min-h-0 flex-1 overflow-hidden">
        {ROW_WIDTHS.map((width, index) => (
          <li
            key={width}
            className="skeleton-row flex items-center gap-3 border-b border-border/60 py-2 pr-3"
            style={{ animationDelay: `${index * 45}ms` }}
          >
            <span className="min-w-0 flex-1">
              <Shimmer className="h-4 rounded-md" style={{ width }} />
              <Shimmer className="mt-2 h-3 w-1/3 rounded-md" />
            </span>
            <Shimmer className="h-3 w-10 shrink-0 rounded-md" />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <>
      {ROW_WIDTHS.map((width, index) => (
        <tr
          key={width}
          className="skeleton-row"
          style={{ animationDelay: `${index * 45}ms` }}
        >
          <td className="w-11 px-3 py-3">
            <Shimmer className="mx-auto size-4 rounded" />
          </td>
          {headers.map((header, column) => (
            <td key={header} className="px-3 py-3">
              <Shimmer
                className="h-4 max-w-full rounded-md"
                style={{
                  width: column === 0 ? width : column % 2 === 0 ? "46%" : "62%",
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function SearchRow({ placeholder }: { placeholder: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative min-w-0 flex-1">
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 rounded-full bg-surface-muted"
        />
        <div className="h-9 rounded-md border border-border/80 bg-surface pl-9 shadow-sm">
          <span className="sr-only">{placeholder}</span>
        </div>
      </div>
      <Shimmer className="size-9 shrink-0 rounded-md" />
    </div>
  );
}

function SectionTabs({ sections }: { sections: readonly string[] }) {
  return (
    <div className="flex rounded-lg border border-border/80 bg-surface p-1 shadow-sm md:inline-flex md:w-fit">
      {sections.map((section, index) => (
        <span
          key={section}
          className={`min-w-0 flex-1 rounded-md px-2 py-2 text-center text-sm font-medium md:flex-none md:px-4 md:py-1.5 ${
            index === 0
              ? "bg-sidebar-active text-text-primary shadow-sm"
              : "text-text-muted"
          }`}
        >
          {section}
        </span>
      ))}
    </div>
  );
}

function ListLoading({ route }: { route: "items" | "batches" | "recipes" }) {
  const copy = LIST_COPY[route];

  return (
    <div
      role="status"
      aria-busy="true"
      className="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <span className="sr-only">{copy.label}</span>

      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden md:hidden">
        <div className="flex shrink-0 flex-col gap-2 pb-3">
          {copy.sections ? <SectionTabs sections={copy.sections} /> : null}
          <SearchRow placeholder={copy.search} />
        </div>
        <ItemRows headers={copy.headers} mobile />
        <div className="mt-auto grid shrink-0 grid-cols-2 gap-2 pt-6">
          <span className="h-10 rounded-md border border-border/80 bg-surface" />
          <Shimmer className="h-10 rounded-md" />
        </div>
      </div>

      <div className="hidden h-full min-h-0 flex-1 flex-col overflow-hidden md:flex">
        <div className="mb-4 flex shrink-0 items-center gap-3">
          {copy.sections ? <SectionTabs sections={copy.sections} /> : null}
          <Shimmer className="h-4 w-16 rounded-md" />
        </div>
        <div className={CARD_CLASS}>
          <div className="flex shrink-0 items-center gap-2 border-b border-border/80 px-5 py-3.5">
            <Shimmer className="h-9 max-w-sm min-w-48 flex-1 rounded-md" />
            <Shimmer className="size-9 shrink-0 rounded-md" />
            <Shimmer className="ml-auto h-9 w-24 rounded-md" />
            <Shimmer className="h-9 w-28 rounded-md" />
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            <table className="w-full table-fixed border-collapse text-sm">
              <thead>
                <tr className="border-b border-border/80 bg-surface-muted text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  <th className="w-11 px-3 py-3">
                    <span className="mx-auto block size-4 rounded border border-border/80 bg-surface" />
                  </th>
                  {copy.headers.map((header) => (
                    <th key={header} className="px-3 py-3 font-semibold">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                <ItemRows headers={copy.headers} />
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function InventoryLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="flex min-h-0 flex-1 flex-col gap-4"
    >
      <span className="sr-only">Loading inventory</span>
      <div className="inline-flex w-fit rounded-lg border border-border/80 bg-surface p-1 shadow-sm">
        <span className="rounded-md bg-sidebar-active px-4 py-1.5 text-sm font-medium text-text-primary shadow-sm">
          <span className="mr-1 font-bold">1.</span>
          Setup rooms
        </span>
        <span className="px-4 py-1.5 text-sm font-medium text-text-muted">
          <span className="mr-1 font-bold">2.</span>
          Count
        </span>
      </div>
      <div className="w-full overflow-hidden rounded-xl border border-border/80 bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-4px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between gap-4 border-b border-border/80 px-5 py-3.5">
          <div className="min-w-0 flex-1">
            <Shimmer className="h-4 w-40 rounded-md" />
            <Shimmer className="mt-2 h-3 w-64 max-w-full rounded-md" />
          </div>
          <Shimmer className="h-9 w-28 shrink-0 rounded-md" />
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
          {ROW_WIDTHS.slice(0, 3).map((width, index) => (
            <div
              key={width}
              className="skeleton-row flex min-h-48 flex-col rounded-lg border border-border/80 p-4"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <Shimmer className="h-4 rounded-md" style={{ width }} />
              <Shimmer className="mt-3 h-3 w-1/2 rounded-md" />
              <Shimmer className="mt-auto h-3 w-16 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function RouteLoading({ route }: { route: ListRoute }) {
  if (route === "inventory") return <InventoryLoading />;
  return <ListLoading route={route} />;
}
