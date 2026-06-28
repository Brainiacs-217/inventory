"use client";

import { useEffect, useState } from "react";

import { Modal } from "@/component/Modal";
import {
  createEmptyStorageRoomFormValues,
  type CreateStorageRoomFormValues,
} from "@/types/storage";

type CreateStorageRoomModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (values: CreateStorageRoomFormValues) => void;
  initialValues?: CreateStorageRoomFormValues;
  title?: string;
  saveLabel?: string;
};

const inputClassName =
  "rounded-sm border border-border/80 bg-surface px-2.5 py-1.5 text-sm text-text-primary shadow-sm transition-[border-color,box-shadow] outline-none placeholder:text-text-muted/60 hover:border-text-muted/30 focus:border-accent/50 focus:ring-2 focus:ring-accent/15 w-full";
const labelClassName =
  "text-[10px] font-medium uppercase tracking-[0.14em] text-text-muted";

export function CreateStorageRoomModal({
  open,
  onClose,
  onSave,
  initialValues,
  title = "Add storage room",
  saveLabel = "Add room",
}: CreateStorageRoomModalProps) {
  const [values, setValues] = useState(createEmptyStorageRoomFormValues());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValues(initialValues ?? createEmptyStorageRoomFormValues());
      setError(null);
    }
  }, [open, initialValues]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const name = values.name.trim();
    if (!name) {
      setError("Room name is required.");
      return;
    }
    onSave({ name, description: values.description.trim() });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description="Label a storage area so items can be assigned and counted."
      footer={
        <div className="flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border/80 bg-surface px-3.5 py-1.5 text-sm font-medium text-text-secondary shadow-sm transition-colors hover:border-text-muted/30 hover:text-text-primary"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-storage-room-form"
            className="rounded-md bg-accent px-3.5 py-1.5 text-sm font-medium text-text-primary shadow-sm transition-[background-color,box-shadow] hover:bg-accent-hover hover:shadow"
          >
            {saveLabel}
          </button>
        </div>
      }
    >
      <form id="create-storage-room-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="room-name" className={labelClassName}>
            Room name
          </label>
          <input
            id="room-name"
            type="text"
            value={values.name}
            onChange={(event) => {
              setValues((current) => ({ ...current, name: event.target.value }));
              setError(null);
            }}
            placeholder="e.g. Walk-in, Dry storage"
            className={inputClassName}
            autoFocus
          />
          {error ? <p className="text-xs text-error">{error}</p> : null}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="room-description" className={labelClassName}>
            Description
          </label>
          <textarea
            id="room-description"
            value={values.description}
            onChange={(event) =>
              setValues((current) => ({ ...current, description: event.target.value }))
            }
            placeholder="Optional — what's stored here"
            rows={3}
            className={`${inputClassName} resize-none`}
          />
        </div>
      </form>
    </Modal>
  );
}
