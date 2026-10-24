"use client";

import { Plus, Search, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { BatchesMobileList } from "@/component/BatchesMobileList";
import { CreateBatchModal } from "@/component/CreateBatchModal";
import { ListFilterButton } from "@/component/ListFilterButton";
import { Modal } from "@/component/Modal";
import { createBatch, deleteBatches, updateBatch } from "@/lib/batches/actions";
import { formatCurrency } from "@/lib/formatCurrency";
import { placeholderBatchPrice } from "@/lib/placeholderPrice";
import {
  formatBatchYield,
  type Batch,
  type CreateBatchFormValues,
} from "@/types/batch";
import type { InventoryItem } from "@/types/item";
import type { UnitOption } from "@/types/recipe";

const SELECT_CELL_CLASS = "w-11 px-3 py-3 text-center align-middle";
const TABLE_CLASS = "w-full table-fixed border-collapse text-sm";

const SEARCH_INPUT_CLASS =
  "w-full rounded-md border border-border/80 bg-surface py-2 pl-9 pr-3 text-sm text-text-primary shadow-sm outline-none placeholder:text-text-muted/60 transition-[border-color,box-shadow] hover:border-text-muted/30 focus:border-accent/50 focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-50";

function formatBatchCount(
  visibleCount: number,
  totalCount: number,
  isFiltering: boolean,
): string {
  if (!isFiltering || totalCount === 0) {
    return totalCount === 1 ? "1 batch" : `${totalCount} batches`;
  }
  return `${visibleCount} of ${totalCount} ${totalCount === 1 ? "batch" : "batches"}`;
}

function formatQuantity(value: number): string {
  if (!Number.isFinite(value)) return "";
  return String(parseFloat(value.toFixed(4)));
}

function formatCreatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
}

function batchMatchesQuery(batch: Batch, query: string, unitFilter: string): boolean {
  if (unitFilter && batch.yieldUnitSymbol !== unitFilter) return false;
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return batch.name.toLowerCase().includes(normalized);
}

type BatchesTableProps = {
  batches: Batch[];
  catalogItems: InventoryItem[];
  units: UnitOption[];
  organizationId: string | null;
};

export function BatchesTable({
  batches,
  catalogItems,
  units,
  organizationId,
}: BatchesTableProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [unitFilter, setUnitFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{
    ids: string[];
    prompt: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const unitOptions = useMemo(() => {
    const symbols = [
      ...new Set(batches.map((batch) => batch.yieldUnitSymbol.trim()).filter(Boolean)),
    ].sort((left, right) => left.localeCompare(right));
    return symbols.map((symbol) => ({ value: symbol, label: symbol }));
  }, [batches]);

  const isFiltering = searchQuery.trim().length > 0 || unitFilter.length > 0;
  const visibleBatches = useMemo(
    () =>
      isFiltering
        ? batches.filter((batch) => batchMatchesQuery(batch, searchQuery, unitFilter))
        : batches,
    [batches, isFiltering, searchQuery, unitFilter],
  );

  const allSelected =
    visibleBatches.length > 0 &&
    visibleBatches.every((batch) => selectedIds.has(batch.id));
  const someVisibleSelected = visibleBatches.some((batch) =>
    selectedIds.has(batch.id),
  );
  const someSelected = selectedIds.size > 0;
  const selectedCount = selectedIds.size;

  async function handleSave(values: CreateBatchFormValues) {
    if (!organizationId) {
      throw new Error("Select an organization before adding batches.");
    }

    const result = editingBatch
      ? await updateBatch(organizationId, editingBatch.id, values)
      : await createBatch(organizationId, values);
    if ("error" in result) {
      throw new Error(result.error);
    }

    router.refresh();
  }

  function toggleSelection(id: string) {
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
        for (const batch of visibleBatches) {
          next.delete(batch.id);
        }
        return next;
      }
      for (const batch of visibleBatches) {
        next.add(batch.id);
      }
      return next;
    });
  }

  function requestDelete(ids: string[], prompt: string) {
    if (!organizationId || ids.length === 0) return;
    setDeleteError(null);
    setPendingDelete({ ids, prompt });
  }

  function handleDeleteClick() {
    if (!someSelected) return;
    const prompt =
      allSelected && !isFiltering
        ? "Are you sure you want to delete all batches?"
        : `Are you sure you want to delete ${selectedCount} selected ${selectedCount === 1 ? "batch" : "batches"}?`;
    requestDelete(Array.from(selectedIds), prompt);
  }

  async function handleDeleteConfirm() {
    if (!organizationId || !pendingDelete) return;

    setDeleting(true);
    setDeleteError(null);

    const result = await deleteBatches(organizationId, pendingDelete.ids);
    if ("error" in result) {
      setDeleteError(result.error);
      setDeleting(false);
      return;
    }

    const deletedIds = new Set(result.data.deletedIds);
    setSelectedIds((current) => {
      const next = new Set(current);
      for (const id of deletedIds) next.delete(id);
      return next;
    });
    setDeleting(false);
    setPendingDelete(null);
    router.refresh();
  }

  function handleDeleteCancel() {
    if (deleting) return;
    setPendingDelete(null);
    setDeleteError(null);
  }

  return (
    <>
      <BatchesMobileList
        organizationId={organizationId}
        searchQuery={searchQuery}
        onSearchQuery={setSearchQuery}
        unitFilter={unitFilter}
        onUnitFilter={setUnitFilter}
        unitOptions={unitOptions}
        visibleBatches={visibleBatches}
        totalCount={batches.length}
        isFiltering={isFiltering}
        selectedIds={selectedIds}
        allSelected={allSelected}
        onToggleBatch={toggleSelection}
        onToggleSelectAll={toggleSelectAll}
        onClearSelection={() => setSelectedIds(new Set())}
        onRequestDelete={requestDelete}
        onAdd={() => {
          setEditingBatch(null);
          setCreateOpen(true);
        }}
        onEdit={(batch) => {
          setCreateOpen(false);
          setEditingBatch(batch);
        }}
      />

      <div className="hidden h-full min-h-0 flex-1 flex-col overflow-hidden md:flex">
        <p className="mb-4 shrink-0 text-sm text-text-muted">
          {formatBatchCount(visibleBatches.length, batches.length, isFiltering)}
        </p>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/80 bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-4px_rgba(0,0,0,0.08)]">
          <div className="flex shrink-0 items-center gap-2 border-b border-border/80 bg-surface px-5 py-3.5">
            <div className="relative min-w-0 max-w-sm flex-1">
              <Search
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-text-muted"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search batches…"
                disabled={!organizationId}
                aria-label="Search batches"
                className={SEARCH_INPUT_CLASS}
              />
            </div>
            <ListFilterButton
              disabled={!organizationId}
              fields={[
                {
                  fieldLabel: "Yield unit",
                  value: unitFilter,
                  onChange: setUnitFilter,
                  allLabel: "All units",
                  options: unitOptions,
                },
              ]}
            />
            {isFiltering ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setUnitFilter("");
                }}
                className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-2 text-sm font-medium text-text-muted transition-colors hover:text-text-primary"
              >
                <X className="size-3.5" strokeWidth={2} />
                Clear
              </button>
            ) : null}
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={handleDeleteClick}
                disabled={!someSelected || !organizationId}
                className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border/80 bg-surface px-4 py-2 text-sm font-medium text-text-secondary shadow-sm transition-colors hover:border-error/30 hover:bg-error/5 hover:text-error disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border/80 disabled:hover:bg-surface disabled:hover:text-text-secondary"
              >
                <Trash2 className="size-4" strokeWidth={2} />
                Delete
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingBatch(null);
                  setCreateOpen(true);
                }}
                disabled={!organizationId}
                className="inline-flex items-center justify-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-text-primary shadow-sm transition-[background-color,box-shadow] hover:bg-accent-hover hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="size-4" strokeWidth={2} />
                Add batch
              </button>
            </div>
          </div>

          <div className="shrink-0">
            <table className={TABLE_CLASS}>
              <colgroup>
                <col className="w-11" />
                <col className="w-[34%]" />
                <col className="w-[16%]" />
                <col className="w-[12%]" />
                <col className="w-[16%]" />
                <col className="w-[16%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-border/80 bg-surface-muted text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  <th className={SELECT_CELL_CLASS}>
                    <input
                      type="checkbox"
                      aria-label="Select all batches"
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
                  <th className="px-3 py-3">Name</th>
                  <th className="px-3 py-3">Yield</th>
                  <th className="px-3 py-3">Items</th>
                  <th className="px-3 py-3">Price</th>
                  <th className="px-3 py-3">Created</th>
                </tr>
              </thead>
            </table>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-none">
            <table className={TABLE_CLASS}>
              <colgroup>
                <col className="w-11" />
                <col className="w-[34%]" />
                <col className="w-[16%]" />
                <col className="w-[12%]" />
                <col className="w-[16%]" />
                <col className="w-[16%]" />
              </colgroup>
              <tbody className="divide-y divide-border/60">
                {visibleBatches.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-text-muted">
                      {organizationId
                        ? isFiltering && batches.length > 0
                          ? "No batches match your filters."
                          : "No batches yet. Add your first batch to get started."
                        : "Select an organization in the sidebar to manage batches."}
                    </td>
                  </tr>
                ) : null}
                {visibleBatches.map((batch) => (
                  <tr
                    key={batch.id}
                    className="group bg-surface transition-colors hover:bg-surface-muted/40"
                  >
                    <td className={SELECT_CELL_CLASS}>
                      <input
                        type="checkbox"
                        aria-label={`Select ${batch.name}`}
                        checked={selectedIds.has(batch.id)}
                        onChange={() => toggleSelection(batch.id)}
                        className="size-4 rounded border-border/80 accent-accent transition-shadow group-hover:shadow-sm"
                      />
                    </td>
                    <td className="px-3 py-3 align-middle">
                      <span
                        className="block truncate font-medium text-text-primary"
                        title={batch.name}
                      >
                        {batch.name}
                      </span>
                    </td>
                    <td className="px-3 py-3 align-middle">
                      <span className="tabular-nums text-text-secondary">
                        {formatBatchYield(batch.yieldQuantity, batch.yieldUnitSymbol)}
                      </span>
                    </td>
                    <td className="px-3 py-3 align-middle">
                      <span className="text-text-secondary">{batch.ingredientCount}</span>
                    </td>
                    <td className="px-3 py-3 align-middle">
                      <span className="tabular-nums font-medium text-text-primary">
                        {formatCurrency(placeholderBatchPrice(batch.id))}
                      </span>
                    </td>
                    <td className="px-3 py-3 align-middle">
                      <span className="tabular-nums text-text-secondary">
                        {formatCreatedAt(batch.createdAt)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <CreateBatchModal
        open={createOpen || editingBatch != null}
        mode={editingBatch ? "edit" : "create"}
        initialValues={
          editingBatch
            ? {
                name: editingBatch.name,
                yieldQuantity: formatQuantity(editingBatch.yieldQuantity),
                yieldUnitId: editingBatch.yieldUnitId,
                ingredients: editingBatch.ingredients,
              }
            : null
        }
        onClose={() => {
          setCreateOpen(false);
          setEditingBatch(null);
        }}
        onSave={handleSave}
        catalogItems={catalogItems}
        units={units}
      />

      <Modal
        open={pendingDelete != null}
        onClose={handleDeleteCancel}
        title="Delete batches"
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
        <p className="text-sm text-text-secondary">{pendingDelete?.prompt}</p>
      </Modal>
    </>
  );
}
