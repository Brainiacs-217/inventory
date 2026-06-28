"use client";

import { PackagePlus, Pencil, Plus, Trash2, Warehouse } from "lucide-react";
import { useState } from "react";

import { CreateStorageRoomModal } from "@/component/CreateStorageRoomModal";
import { ManageRoomItemsModal } from "@/component/ManageRoomItemsModal";
import { Modal } from "@/component/Modal";
import { CHART_ICON_BADGE_CLASS } from "@/lib/chartInteraction";
import type {
  CreateStorageRoomFormValues,
  StorageCatalogItem,
  StorageRoom,
} from "@/types/storage";

const CARD_CLASS =
  "w-full rounded-xl border border-border/80 bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-4px_rgba(0,0,0,0.08)]";

type StorageRoomsPanelProps = {
  rooms: StorageRoom[];
  catalogItems: StorageCatalogItem[];
  onAddRoom: (values: CreateStorageRoomFormValues) => Promise<StorageRoom>;
  onUpdateRoom: (roomId: string, values: CreateStorageRoomFormValues) => Promise<void>;
  onDeleteRoom: (roomId: string) => Promise<void>;
  onUpdateRoomItems: (roomId: string, itemIds: string[]) => Promise<void>;
};

function formatItemCount(count: number): string {
  return count === 1 ? "1 item" : `${count} items`;
}

export function StorageRoomsPanel({
  rooms,
  catalogItems,
  onAddRoom,
  onUpdateRoom,
  onDeleteRoom,
  onUpdateRoomItems,
}: StorageRoomsPanelProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [renameRoom, setRenameRoom] = useState<StorageRoom | null>(null);
  const [manageItemsRoom, setManageItemsRoom] = useState<StorageRoom | null>(null);
  const [deleteRoom, setDeleteRoom] = useState<StorageRoom | null>(null);

  return (
    <>
      <div className={CARD_CLASS}>
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border/80 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className={CHART_ICON_BADGE_CLASS}>
              <Warehouse className="size-4 text-text-muted" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight text-text-primary">
                Set up storage rooms
              </p>
              <p className="text-xs text-text-muted">
                Create each room, then assign the items stored there
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-text-primary shadow-sm transition-[background-color,box-shadow] hover:bg-accent-hover hover:shadow"
          >
            <Plus className="size-4" strokeWidth={2} />
            Add room
          </button>
        </div>

        {rooms.length > 0 ? (
          <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
            {rooms.map((room) => {
              const hasItems = room.itemIds.length > 0;

              return (
              <article
                key={room.id}
                className={`flex min-h-48 flex-col overflow-hidden rounded-lg border shadow-sm ${
                  hasItems
                    ? "border-border/80 bg-surface"
                    : "border-warning/30 bg-warning/5"
                }`}
              >
                <div className="min-h-24 border-b border-border/60 bg-surface-muted px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="min-w-0 truncate text-sm font-semibold text-text-primary">
                      {room.name}
                    </h3>
                    {hasItems ? (
                      <span className="shrink-0 text-xs font-medium text-text-muted">
                        {formatItemCount(room.itemIds.length)}
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-medium text-warning">
                        Needs items
                      </span>
                    )}
                  </div>
                  {room.description ? (
                    <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-text-secondary">
                      {room.description}
                    </p>
                  ) : null}
                  {!hasItems ? (
                    <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">
                      No items assigned yet. Choose which products are stored in this room.
                    </p>
                  ) : null}
                </div>
                <div className="mt-auto flex flex-col gap-2 p-4">
                  <button
                    type="button"
                    onClick={() => setManageItemsRoom(room)}
                    className={`inline-flex w-full items-center justify-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium shadow-sm transition-colors ${
                      hasItems
                        ? "border border-border/80 bg-surface text-text-secondary hover:border-text-muted/30 hover:text-text-primary"
                        : "bg-accent text-text-primary hover:bg-accent-hover"
                    }`}
                  >
                    <PackagePlus className="size-3" strokeWidth={2} />
                    {hasItems ? "Edit items" : "Assign items"}
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setRenameRoom(room)}
                      className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-border/80 bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary shadow-sm transition-colors hover:border-text-muted/30 hover:text-text-primary"
                    >
                      <Pencil className="size-3" strokeWidth={2} />
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteRoom(room)}
                      className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-border/80 bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary shadow-sm transition-colors hover:border-error/30 hover:bg-error/5 hover:text-error"
                    >
                      <Trash2 className="size-3" strokeWidth={2} />
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            );
            })}
          </div>
        ) : null}
      </div>

      <CreateStorageRoomModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSave={async (values) => {
          const room = await onAddRoom(values);
          setManageItemsRoom(room);
        }}
      />

      <CreateStorageRoomModal
        open={renameRoom != null}
        onClose={() => setRenameRoom(null)}
        onSave={async (values) => {
          if (renameRoom) await onUpdateRoom(renameRoom.id, values);
        }}
        initialValues={
          renameRoom
            ? { name: renameRoom.name, description: renameRoom.description ?? "" }
            : undefined
        }
        title="Rename storage room"
        saveLabel="Save changes"
      />

      {manageItemsRoom ? (
        <ManageRoomItemsModal
          open
          onClose={() => setManageItemsRoom(null)}
          roomName={manageItemsRoom.name}
          catalogItems={catalogItems}
          selectedItemIds={manageItemsRoom.itemIds}
          onSave={(itemIds) => onUpdateRoomItems(manageItemsRoom.id, itemIds)}
        />
      ) : null}

      <Modal
        open={deleteRoom != null}
        onClose={() => setDeleteRoom(null)}
        title="Delete storage room"
        footer={
          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setDeleteRoom(null)}
              className="rounded-md border border-border/80 bg-surface px-3.5 py-1.5 text-sm font-medium text-text-secondary shadow-sm transition-colors hover:border-text-muted/30 hover:text-text-primary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                if (deleteRoom) await onDeleteRoom(deleteRoom.id);
                setDeleteRoom(null);
              }}
              className="rounded-md bg-error px-3.5 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-error/90"
            >
              Delete
            </button>
          </div>
        }
      >
        <p className="text-sm text-text-secondary">
          Are you sure you want to delete{" "}
          <span className="font-medium text-text-primary">{deleteRoom?.name}</span>? Item
          assignments for this room will be removed.
        </p>
      </Modal>
    </>
  );
}
