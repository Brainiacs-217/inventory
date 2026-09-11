"use client";

import { Package, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { CreateFoodItemModal } from "@/component/CreateFoodItemModal";
import { CreateItemModal } from "@/component/CreateItemModal";
import { CreateSupplyItemModal } from "@/component/CreateSupplyItemModal";
import { Modal } from "@/component/Modal";
import { CHART_ICON_BADGE_CLASS } from "@/lib/chartInteraction";
import { createItem, deleteItems } from "@/lib/items/actions";
import { ITEM_CATEGORIES, type ItemCategory } from "@/lib/lookups";
import type { CreateItemFormValues, InventoryItem } from "@/types/item";

const SELECT_CELL_CLASS = "w-11 px-3 py-3 text-center align-middle";

function formatItemCount(count: number): string {
  return count === 1 ? "1 item" : `${count} items`;
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
  const [activeSection, setActiveSection] = useState<ItemCategory>("Food");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const visibleItems = useMemo(
    () => items.filter((item) => item.category === activeSection),
    [activeSection, items],
  );

  const allSelected =
    visibleItems.length > 0 && selectedIds.size === visibleItems.length;
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
    setSelectedIds(
      allSelected ? new Set() : new Set(visibleItems.map((item) => item.id)),
    );
  }

  function handleSectionChange(section: ItemCategory) {
    setActiveSection(section);
    setSelectedIds(new Set());
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
      <div className="mb-4 inline-flex w-fit rounded-lg border border-border/80 bg-surface p-1 shadow-sm">
        {ITEM_CATEGORIES.map((section) => (
          <button
            key={section}
            type="button"
            onClick={() => handleSectionChange(section)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              activeSection === section
                ? "bg-sidebar-active text-text-primary shadow-sm"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            {section}
          </button>
        ))}
      </div>

      <div className="w-full overflow-hidden rounded-xl border border-border/80 bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-4px_rgba(0,0,0,0.08)]">
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border/80 bg-surface px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className={CHART_ICON_BADGE_CLASS}>
              <Package className="size-4 text-text-muted" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight text-text-primary">
                {formatItemCount(visibleItems.length)}
              </p>
              <p className="text-xs text-text-muted">
                {!organizationId
                  ? "Select an organization to view items"
                  : `${activeSection} in your catalog`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDeleteClick}
              disabled={!someSelected || !organizationId}
              className="inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-surface px-4 py-2 text-sm font-medium text-text-secondary shadow-sm transition-colors hover:border-error/30 hover:bg-error/5 hover:text-error disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border/80 disabled:hover:bg-surface disabled:hover:text-text-secondary"
            >
              <Trash2 className="size-4" strokeWidth={2} />
              Delete
            </button>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              disabled={!organizationId}
              className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-text-primary shadow-sm transition-[background-color,box-shadow] hover:bg-accent-hover hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="size-4" strokeWidth={2} />
              Add item
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-fixed border-collapse text-sm">
            <colgroup>
              <col className="w-11" />
              <col className="w-[15%]" />
              <col className="w-[15%]" />
              <col className="w-[13%]" />
              <col className="w-[11%]" />
              <col className="w-[14%]" />
              <col className="w-[9%]" />
              <col className="w-[21%]" />
            </colgroup>
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-border/80 bg-surface-muted/80 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted backdrop-blur-sm">
                <th className={SELECT_CELL_CLASS}>
                  <input
                    type="checkbox"
                    aria-label="Select all items"
                    checked={allSelected}
                    ref={(input) => {
                      if (input) {
                        input.indeterminate = someSelected && !allSelected;
                      }
                    }}
                    onChange={toggleSelectAll}
                    className="size-4 rounded border-border/80 accent-accent"
                  />
                </th>
                <th className="px-3 py-3">Name</th>
                <th className="px-3 py-3">Reporting Unit</th>
                <th className="px-3 py-3">Cost</th>
                <th className="px-3 py-3">SKU</th>
                <th className="px-3 py-3">Category</th>
                <th className="px-3 py-3">GL Code</th>
                <th className="px-3 py-3">Vendor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {visibleItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-sm text-text-muted">
                    {organizationId
                      ? sectionEmptyLabel(activeSection)
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
                  <td className="px-3 py-3 align-middle">
                    <span
                      className="block truncate font-medium text-text-primary"
                      title={item.name}
                    >
                      {item.name}
                    </span>
                  </td>
                  <td className="px-3 py-3 align-middle">
                    <span
                      className="block truncate text-text-secondary"
                      title={item.reportingUnit}
                    >
                      {item.reportingUnit}
                    </span>
                  </td>
                  <td className="px-3 py-3 align-middle">
                    <span className="tabular-nums font-medium text-text-primary">
                      ${item.cost.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-3 py-3 align-middle">
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
                  <td className="px-3 py-3 align-middle">
                    <span
                      className="block truncate text-sm font-medium text-text-primary"
                      title={item.category}
                    >
                      {item.category}
                    </span>
                  </td>
                  <td className="px-3 py-3 align-middle">
                    {item.glCode ? (
                      <span
                        className="block truncate font-mono text-xs text-text-secondary"
                        title={item.glCode}
                      >
                        {item.glCode}
                      </span>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 align-middle">
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
