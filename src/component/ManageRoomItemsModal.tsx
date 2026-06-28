"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Modal } from "@/component/Modal";
import type { StorageCatalogItem } from "@/types/storage";

type ManageRoomItemsModalProps = {
  open: boolean;
  onClose: () => void;
  roomName: string;
  catalogItems: StorageCatalogItem[];
  selectedItemIds: string[];
  onSave: (itemIds: string[]) => Promise<void>;
};

const inputClassName =
  "rounded-sm border border-border/80 bg-surface px-2.5 py-1.5 text-sm text-text-primary shadow-sm transition-[border-color,box-shadow] outline-none placeholder:text-text-muted/60 hover:border-text-muted/30 focus:border-accent/50 focus:ring-2 focus:ring-accent/15 w-full";

export function ManageRoomItemsModal({
  open,
  onClose,
  roomName,
  catalogItems,
  selectedItemIds,
  onSave,
}: ManageRoomItemsModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setSelected(new Set(selectedItemIds));
      setQuery("");
    }
  }, [open, selectedItemIds]);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return catalogItems;
    return catalogItems.filter(
      (item) =>
        item.name.toLowerCase().includes(normalized) ||
        item.reportingUnit.toLowerCase().includes(normalized),
    );
  }, [catalogItems, query]);

  function toggleItem(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(Array.from(selected));
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Items in ${roomName}`}
      description="Check every item that is physically stored in this room. Employees will count these during inventory checks."
      size="lg"
      footer={
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-text-muted">
            {selected.size} {selected.size === 1 ? "item" : "items"} selected
          </p>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border/80 bg-surface px-3.5 py-1.5 text-sm font-medium text-text-secondary shadow-sm transition-colors hover:border-text-muted/30 hover:text-text-primary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-md bg-accent px-3.5 py-1.5 text-sm font-medium text-text-primary shadow-sm transition-[background-color,box-shadow] hover:bg-accent-hover hover:shadow disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save items"}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-text-muted"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search items…"
            className={`${inputClassName} pl-9`}
          />
        </div>
        <ul className="max-h-80 overflow-y-auto rounded-md border border-border/80">
          {filteredItems.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-text-muted">No items match.</li>
          ) : (
            filteredItems.map((item) => (
              <li key={item.id} className="border-b border-border/60 last:border-b-0">
                <label className="flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-surface-muted/60">
                  <input
                    type="checkbox"
                    checked={selected.has(item.id)}
                    onChange={() => toggleItem(item.id)}
                    className="size-4 rounded border-border text-accent focus:ring-accent/30"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-text-primary">{item.name}</span>
                    <span className="block truncate text-xs text-text-muted">
                      {item.reportingUnit} · par {item.par}
                    </span>
                  </span>
                </label>
              </li>
            ))
          )}
        </ul>
      </div>
    </Modal>
  );
}
