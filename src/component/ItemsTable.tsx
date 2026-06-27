"use client";

import { Package, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { CreateItemModal } from "@/component/CreateItemModal";
import { Modal } from "@/component/Modal";
import { CHART_ICON_BADGE_CLASS } from "@/lib/chartInteraction";
import { MOCK_ITEMS } from "@/lib/mock/items";
import {
  type CreateItemFormValues,
  formatReportingUnitDisplay,
  type InventoryItem,
} from "@/types/item";

const SELECT_CELL_CLASS = "w-11 px-3 py-3 text-center align-middle";

function formatItemCount(count: number): string {
  return count === 1 ? "1 item" : `${count} items`;
}

function mapFormToItem(values: CreateItemFormValues): InventoryItem {
  return {
    id: crypto.randomUUID(),
    name: values.name.trim(),
    reportingUnit: formatReportingUnitDisplay(
      values.unitName,
      values.unitSize,
      values.unitOfMeasure,
    ),
    cost: parseFloat(values.cost),
    sku: values.sku.trim(),
    category: values.category,
    subcategory: values.subcategory.trim(),
    glCode: values.glCode.trim() || null,
    vendor: values.vendor,
  };
}

type ItemsTableProps = {
  items?: InventoryItem[];
};

export function ItemsTable({ items: initialItems = MOCK_ITEMS }: ItemsTableProps) {
  const [items, setItems] = useState(initialItems);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const allSelected = items.length > 0 && selectedIds.size === items.length;
  const someSelected = selectedIds.size > 0;
  const selectedCount = selectedIds.size;

  function handleSave(values: CreateItemFormValues) {
    setItems((current) => [...current, mapFormToItem(values)]);
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
    setSelectedIds(allSelected ? new Set() : new Set(items.map((item) => item.id)));
  }

  function handleDeleteClick() {
    if (!someSelected) return;
    setDeleteConfirmOpen(true);
  }

  function handleDeleteConfirm() {
    setItems((current) => current.filter((item) => !selectedIds.has(item.id)));
    setSelectedIds(new Set());
    setDeleteConfirmOpen(false);
  }

  return (
    <>
      <div className="w-full overflow-hidden rounded-xl border border-border/80 bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-4px_rgba(0,0,0,0.08)]">
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border/80 bg-surface px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className={CHART_ICON_BADGE_CLASS}>
              <Package className="size-4 text-text-muted" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight text-text-primary">
                {formatItemCount(items.length)}
              </p>
              <p className="text-xs text-text-muted">In your catalog</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDeleteClick}
              disabled={!someSelected}
              className="inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-surface px-4 py-2 text-sm font-medium text-text-secondary shadow-sm transition-colors hover:border-error/30 hover:bg-error/5 hover:text-error disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border/80 disabled:hover:bg-surface disabled:hover:text-text-secondary"
            >
              <Trash2 className="size-4" strokeWidth={2} />
              Delete
            </button>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-text-primary shadow-sm transition-[background-color,box-shadow] hover:bg-accent-hover hover:shadow"
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
              {items.map((item) => (
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
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSave={handleSave}
      />

      <Modal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Delete items"
        footer={
          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setDeleteConfirmOpen(false)}
              className="rounded-md border border-border/80 bg-surface px-3.5 py-1.5 text-sm font-medium text-text-secondary shadow-sm transition-colors hover:border-text-muted/30 hover:text-text-primary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              className="rounded-md bg-error px-3.5 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-error/90"
            >
              Delete
            </button>
          </div>
        }
      >
        <p className="text-sm text-text-secondary">
          {allSelected
            ? "Are you sure you want to delete all items?"
            : `Are you sure you want to delete ${selectedCount} selected ${selectedCount === 1 ? "item" : "items"}?`}
        </p>
      </Modal>
    </>
  );
}
