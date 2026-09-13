"use client";

import { ChevronDown, Plus, Search, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";

import { CreateFoodItemModal } from "@/component/CreateFoodItemModal";
import { CreateItemModal } from "@/component/CreateItemModal";
import { CreateSupplyItemModal } from "@/component/CreateSupplyItemModal";
import { Modal } from "@/component/Modal";
import { createItem, deleteItems } from "@/lib/items/actions";
import { ITEM_CATEGORIES, type ItemCategory } from "@/lib/lookups";
import type { CreateItemFormValues, InventoryItem } from "@/types/item";

const SELECT_CELL_CLASS = "w-11 px-3 py-3 text-center align-middle";
const NO_VENDOR = "__none__";
const TABLE_CLASS = "w-full table-fixed border-collapse text-sm";

function TableColgroup() {
  return (
    <colgroup>
      <col className="w-10 md:w-11" />
      <col />
      <col className="hidden md:table-column md:w-[16%]" />
      <col className="w-[22%] md:w-[10%]" />
      <col className="hidden md:table-column md:w-[12%]" />
      <col className="w-[26%] md:w-[14%]" />
      <col className="hidden w-[28%] md:table-column md:w-[16%]" />
    </colgroup>
  );
}

const SEARCH_INPUT_CLASS =
  "w-full rounded-md border border-border/80 bg-surface py-2 pl-9 pr-3 text-sm text-text-primary shadow-sm outline-none placeholder:text-text-muted/60 transition-[border-color,box-shadow] hover:border-text-muted/30 focus:border-accent/50 focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-50";

const FILTER_SELECT_CLASS =
  "w-full appearance-none rounded-md border border-border/80 bg-surface py-2 pl-3 pr-8 text-sm text-text-primary shadow-sm outline-none transition-[border-color,box-shadow] hover:border-text-muted/30 focus:border-accent/50 focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-50";

function formatItemCount(
  visibleCount: number,
  sectionCount: number,
  isFiltering: boolean,
): string {
  if (!isFiltering || sectionCount === 0) {
    return sectionCount === 1 ? "1 item" : `${sectionCount} items`;
  }
  return `${visibleCount} of ${sectionCount} ${sectionCount === 1 ? "item" : "items"}`;
}

function itemMatchesQuery(item: InventoryItem, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return [item.name, item.sku, item.vendor].some((value) =>
    value.toLowerCase().includes(normalized),
  );
}

function itemCategoryLabel(item: InventoryItem): string {
  return item.subcategory || item.category;
}

function itemVendorKey(item: InventoryItem): string {
  return item.vendor.trim() ? item.vendor : NO_VENDOR;
}

function uniqueSorted(values: Iterable<string>): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

function itemMatchesFilters(
  item: InventoryItem,
  query: string,
  category: string,
  vendor: string,
): boolean {
  if (!itemMatchesQuery(item, query)) return false;
  if (category && itemCategoryLabel(item) !== category) return false;
  if (vendor && itemVendorKey(item) !== vendor) return false;
  return true;
}

function FilterSelect({
  value,
  onChange,
  label,
  disabled,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="relative min-w-0 flex-1 md:max-w-48 md:flex-none md:min-w-34">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        aria-label={label}
        className={FILTER_SELECT_CLASS}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-text-muted"
      />
    </div>
  );
}

function sectionEmptyLabel(section: ItemCategory): string {
  switch (section) {
    case "Beverage":
      return "No beverage items yet. Add your first beverage to get started.";
    case "Food":
      return "No food items yet. Add your first food item to get started.";
    case "Supply":
      return "No supply items yet. Add your first supply to get started.";
  }
}

type ItemsTableProps = {
  items: InventoryItem[];
  organizationId: string | null;
};

export function ItemsTable({ items, organizationId }: ItemsTableProps) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<ItemCategory>("Beverage");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const sectionItems = useMemo(
    () => items.filter((item) => item.category === activeSection),
    [activeSection, items],
  );
  const isFiltering =
    searchQuery.trim().length > 0 ||
    categoryFilter.length > 0 ||
    vendorFilter.length > 0;
  const visibleItems = useMemo(
    () =>
      isFiltering
        ? sectionItems.filter((item) =>
            itemMatchesFilters(
              item,
              searchQuery,
              categoryFilter,
              vendorFilter,
            ),
          )
        : sectionItems,
    [categoryFilter, isFiltering, searchQuery, sectionItems, vendorFilter],
  );
  const categoryOptions = useMemo(
    () => uniqueSorted(sectionItems.map(itemCategoryLabel)),
    [sectionItems],
  );
  const vendorOptions = useMemo(
    () => uniqueSorted(sectionItems.map(itemVendorKey)),
    [sectionItems],
  );

  const allSelected =
    visibleItems.length > 0 &&
    visibleItems.every((item) => selectedIds.has(item.id));
  const someVisibleSelected = visibleItems.some((item) =>
    selectedIds.has(item.id),
  );
  const someSelected = selectedIds.size > 0;
  const selectedCount = selectedIds.size;

  async function handleSave(values: CreateItemFormValues) {
    if (!organizationId) {
      throw new Error("Select an organization before adding items.");
    }

    const result = await createItem(organizationId, values);
    if ("error" in result) {
      throw new Error(result.error);
    }

    router.refresh();
  }

  function toggleItemSelection(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allSelected) {
        for (const item of visibleItems) {
          next.delete(item.id);
        }
        return next;
      }
      for (const item of visibleItems) {
        next.add(item.id);
      }
      return next;
    });
  }

  function handleSectionChange(section: ItemCategory) {
    setActiveSection(section);
    setSelectedIds(new Set());
    setCategoryFilter("");
    setVendorFilter("");
  }

  function handleClearFilters() {
    setSearchQuery("");
    setCategoryFilter("");
    setVendorFilter("");
  }

  function handleDeleteClick() {
    if (!someSelected) return;
    setDeleteError(null);
    setDeleteConfirmOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!organizationId || !someSelected) return;

    setDeleting(true);
    setDeleteError(null);

    const result = await deleteItems(organizationId, Array.from(selectedIds));
    if ("error" in result) {
      setDeleteError(result.error);
      setDeleting(false);
      return;
    }

    setSelectedIds(new Set());
    setDeleting(false);
    setDeleteConfirmOpen(false);
    router.refresh();
  }

  function handleDeleteCancel() {
    if (deleting) return;
    setDeleteConfirmOpen(false);
    setDeleteError(null);
  }

  return (
    <>
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        <div className="mb-3 flex shrink-0 items-center gap-2 md:mb-4 md:gap-3">
          <div className="flex min-w-0 flex-1 rounded-lg border border-border/80 bg-surface p-1 shadow-sm md:inline-flex md:w-fit md:flex-none">
            {ITEM_CATEGORIES.map((section) => (
              <button
                key={section}
                type="button"
                onClick={() => handleSectionChange(section)}
                className={`min-w-0 flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors md:flex-none md:px-4 md:text-sm ${
                  activeSection === section
                    ? "bg-sidebar-active text-text-primary shadow-sm"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                {section}
              </button>
            ))}
          </div>
          <p className="shrink-0 text-xs text-text-muted md:text-sm">
            {formatItemCount(
              visibleItems.length,
              sectionItems.length,
              isFiltering,
            )}
          </p>
        </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/80 bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-4px_rgba(0,0,0,0.08)]">
        <div className="flex shrink-0 flex-col gap-2 border-b border-border/80 bg-surface px-3 py-3 md:flex-row md:flex-wrap md:items-center md:px-5 md:py-3.5">
          <div className="flex min-w-0 w-full flex-col gap-2 md:flex-1 md:flex-row md:flex-wrap md:items-center">
            <div className="relative w-full min-w-0 md:max-w-sm md:min-w-48 md:flex-1">
              <Search
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-text-muted"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search items…"
                disabled={!organizationId}
                aria-label="Search items"
                className={SEARCH_INPUT_CLASS}
              />
            </div>
            <div className="flex min-w-0 w-full items-center gap-2 md:w-auto md:flex-1">
              <FilterSelect
                value={categoryFilter}
                onChange={setCategoryFilter}
                label="Filter by category"
                disabled={!organizationId}
              >
                <option value="">All categories</option>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </FilterSelect>
              <FilterSelect
                value={vendorFilter}
                onChange={setVendorFilter}
                label="Filter by vendor"
                disabled={!organizationId}
              >
                <option value="">All vendors</option>
                {vendorOptions.map((vendor) => (
                  <option key={vendor} value={vendor}>
                    {vendor === NO_VENDOR ? "No vendor" : vendor}
                  </option>
                ))}
              </FilterSelect>
              {isFiltering ? (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-2 text-sm font-medium text-text-muted transition-colors hover:text-text-primary"
                >
                  <X className="size-3.5" strokeWidth={2} />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              ) : null}
            </div>
          </div>
          <div className="grid w-full grid-cols-2 gap-2 md:flex md:w-auto md:shrink-0">
            <button
              type="button"
              onClick={handleDeleteClick}
              disabled={!someSelected || !organizationId}
              className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border/80 bg-surface px-3 py-2 text-sm font-medium text-text-secondary shadow-sm transition-colors hover:border-error/30 hover:bg-error/5 hover:text-error disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border/80 disabled:hover:bg-surface disabled:hover:text-text-secondary md:px-4"
            >
              <Trash2 className="size-4" strokeWidth={2} />
              Delete
            </button>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              disabled={!organizationId}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-accent px-3 py-2 text-sm font-medium text-text-primary shadow-sm transition-[background-color,box-shadow] hover:bg-accent-hover hover:shadow disabled:cursor-not-allowed disabled:opacity-50 md:px-4"
            >
              <Plus className="size-4" strokeWidth={2} />
              Add item
            </button>
          </div>
        </div>

        <div className="shrink-0 scrollbar-gutter-stable">
          <table className={TABLE_CLASS}>
            <TableColgroup />
            <thead>
              <tr className="border-b border-border/80 bg-surface-muted text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                <th className={SELECT_CELL_CLASS}>
                  <input
                    type="checkbox"
                    aria-label="Select all items"
                    checked={allSelected}
                    ref={(input) => {
                      if (input) {
                        input.indeterminate = someVisibleSelected && !allSelected;
                      }
                    }}
                    onChange={toggleSelectAll}
                    className="size-4 rounded border-border/80 accent-accent"
                  />
                </th>
                <th className="px-2 py-2.5 md:px-3 md:py-3">Name</th>
                <th className="hidden px-3 py-3 md:table-cell">Reporting Unit</th>
                <th className="px-2 py-2.5 md:px-3 md:py-3">Cost</th>
                <th className="hidden px-3 py-3 md:table-cell">SKU</th>
                <th className="px-2 py-2.5 md:px-3 md:py-3">Category</th>
                <th className="hidden px-2 py-2.5 md:table-cell md:px-3 md:py-3">Vendor</th>
              </tr>
            </thead>
          </table>
        </div>

        <div className="scrollbar-gutter-stable min-h-0 flex-1 overflow-y-auto overscroll-none">
          <table className={TABLE_CLASS}>
            <TableColgroup />
            <tbody className="divide-y divide-border/60">
              {visibleItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-text-muted">
                    {organizationId
                      ? isFiltering && sectionItems.length > 0
                        ? "No items match your filters."
                        : sectionEmptyLabel(activeSection)
                      : "Select an organization in the sidebar to manage items."}
                  </td>
                </tr>
              ) : null}
              {visibleItems.map((item) => (
                <tr
                  key={item.id}
                  className="group bg-surface transition-colors hover:bg-surface-muted/40"
                >
                  <td className={SELECT_CELL_CLASS}>
                    <input
                      type="checkbox"
                      aria-label={`Select ${item.name}`}
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleItemSelection(item.id)}
                      className="size-4 rounded border-border/80 accent-accent transition-shadow group-hover:shadow-sm"
                    />
                  </td>
                  <td className="px-2 py-2.5 align-middle md:px-3 md:py-3">
                    <span
                      className="block truncate font-medium text-text-primary"
                      title={item.name}
                    >
                      {item.name}
                    </span>
                  </td>
                  <td className="hidden px-3 py-3 align-middle md:table-cell">
                    <span
                      className="block truncate text-text-secondary"
                      title={item.reportingUnit}
                    >
                      {item.reportingUnit}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 align-middle md:px-3 md:py-3">
                    <span className="tabular-nums font-medium text-text-primary">
                      ${item.cost.toFixed(2)}
                    </span>
                  </td>
                  <td className="hidden px-3 py-3 align-middle md:table-cell">
                    {item.sku ? (
                      <span
                        className="block truncate rounded-md border border-border/60 bg-surface-muted/60 px-2 py-0.5 font-mono text-xs text-text-secondary"
                        title={item.sku}
                      >
                        {item.sku}
                      </span>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </td>
                  <td className="px-2 py-2.5 align-middle md:px-3 md:py-3">
                    <span
                      className="block truncate text-sm font-medium text-text-primary"
                      title={
                        item.subcategory
                          ? `${item.category} / ${item.subcategory}`
                          : item.category
                      }
                    >
                      {item.subcategory || item.category}
                    </span>
                  </td>
                  <td className="hidden px-2 py-2.5 align-middle md:table-cell md:px-3 md:py-3">
                    <span
                      className="block truncate text-text-secondary"
                      title={item.vendor}
                    >
                      {item.vendor}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>

      <CreateItemModal
        open={createOpen && activeSection === "Beverage"}
        onClose={() => setCreateOpen(false)}
        onSave={handleSave}
      />

      <CreateFoodItemModal
        open={createOpen && activeSection === "Food"}
        onClose={() => setCreateOpen(false)}
      />

      <CreateSupplyItemModal
        open={createOpen && activeSection === "Supply"}
        onClose={() => setCreateOpen(false)}
      />

      <Modal
        open={deleteConfirmOpen}
        onClose={handleDeleteCancel}
        title="Delete items"
        footer={
          <div className="flex flex-col gap-2">
            {deleteError && <p className="text-xs text-error">{deleteError}</p>}
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={handleDeleteCancel}
                disabled={deleting}
                className="rounded-md border border-border/80 bg-surface px-3.5 py-1.5 text-sm font-medium text-text-secondary shadow-sm transition-colors hover:border-text-muted/30 hover:text-text-primary disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="rounded-md bg-error px-3.5 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-error/90 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        }
      >
        <p className="text-sm text-text-secondary">
          {allSelected
            ? `Are you sure you want to delete all ${activeSection.toLowerCase()} items?`
            : `Are you sure you want to delete ${selectedCount} selected ${selectedCount === 1 ? "item" : "items"}?`}
        </p>
      </Modal>
    </>
  );
}
