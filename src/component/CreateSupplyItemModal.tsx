"use client";

import { Modal } from "@/component/Modal";

type CreateSupplyItemModalProps = {
  open: boolean;
  onClose: () => void;
};

export function CreateSupplyItemModal({
  open,
  onClose,
}: CreateSupplyItemModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create supply item"
      description="Supply item form coming soon."
      footer={
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm border border-border/80 bg-surface px-3.5 py-1.5 text-sm font-medium text-text-secondary shadow-sm transition-colors hover:border-text-muted/30 hover:text-text-primary"
          >
            Close
          </button>
        </div>
      }
    >
      <div className="flex min-h-40 items-center justify-center rounded-sm border border-dashed border-border/80 bg-surface-muted/30 px-4 py-8">
        <p className="text-sm text-text-muted">Supply create form placeholder</p>
      </div>
    </Modal>
  );
}
