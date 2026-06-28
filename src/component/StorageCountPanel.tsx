"use client";

import { ArrowRight, ClipboardList } from "lucide-react";
import { useState } from "react";

import { CHART_ICON_BADGE_CLASS } from "@/lib/chartInteraction";
import type {
  SavedRoomCheck,
  StorageCatalogItem,
  StorageRoom,
} from "@/types/storage";

const CARD_CLASS =
  "w-full overflow-hidden rounded-xl border border-border/80 bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-4px_rgba(0,0,0,0.08)]";

const inputClassName =
  "w-24 rounded-sm border border-border/80 bg-surface px-2.5 py-1.5 text-right text-sm text-text-primary shadow-sm transition-[border-color,box-shadow] outline-none hover:border-text-muted/30 focus:border-accent/50 focus:ring-2 focus:ring-accent/15";

type RoomCountStatus = "not_started" | "in_progress" | "saved_today" | "needs_setup";

type StorageCountPanelProps = {
  rooms: StorageRoom[];
  catalogItems: StorageCatalogItem[];
  selectedRoomId: string | null;
  draftsByRoom: Record<string, Record<string, number | "">>;
  history: SavedRoomCheck[];
  saveMessage: string | null;
  onSelectRoom: (roomId: string) => void;
  onCountChange: (itemId: string, value: number | "") => void;
  onSaveRoomCheck: () => Promise<void>;
  onGoToRoomsTab: () => void;
};

function getCatalogItemMap(items: StorageCatalogItem[]): Map<string, StorageCatalogItem> {
  return new Map(items.map((item) => [item.id, item]));
}

function isSavedToday(isoDate: string): boolean {
  const saved = new Date(isoDate);
  const now = new Date();
  return (
    saved.getFullYear() === now.getFullYear() &&
    saved.getMonth() === now.getMonth() &&
    saved.getDate() === now.getDate()
  );
}

function getRoomStatus(
  room: StorageRoom,
  draftCounts: Record<string, number | "">,
  history: SavedRoomCheck[],
): RoomCountStatus {
  if (room.itemIds.length === 0) return "needs_setup";

  const hasDraft = room.itemIds.some((itemId) => {
    const value = draftCounts[itemId];
    return value !== "" && value !== undefined;
  });
  if (hasDraft) return "in_progress";

  const savedToday = history.some(
    (check) => check.roomId === room.id && isSavedToday(check.savedAt),
  );
  if (savedToday) return "saved_today";

  return "not_started";
}

function statusLabel(status: RoomCountStatus): string {
  switch (status) {
    case "needs_setup":
      return "Needs setup";
    case "in_progress":
      return "In progress";
    case "saved_today":
      return "Saved today";
    default:
      return "Ready to count";
  }
}

function statusClass(status: RoomCountStatus): string {
  switch (status) {
    case "needs_setup":
      return "bg-warning/15 text-warning";
    case "in_progress":
      return "bg-accent/15 text-text-primary";
    case "saved_today":
      return "bg-success/10 text-success";
    default:
      return "bg-surface-muted text-text-muted";
  }
}

function countEntered(value: number | "" | undefined): value is number {
  return value !== "" && value !== undefined;
}

export function StorageCountPanel({
  rooms,
  catalogItems,
  selectedRoomId,
  draftsByRoom,
  history,
  saveMessage,
  onSelectRoom,
  onCountChange,
  onSaveRoomCheck,
  onGoToRoomsTab,
}: StorageCountPanelProps) {
  const [saving, setSaving] = useState(false);
  const catalogById = getCatalogItemMap(catalogItems);
  const selectedRoom = rooms.find((room) => room.id === selectedRoomId) ?? null;
  const selectedDraft = selectedRoomId ? (draftsByRoom[selectedRoomId] ?? {}) : {};
  const roomItems =
    selectedRoom?.itemIds
      .map((itemId) => catalogById.get(itemId))
      .filter((item): item is StorageCatalogItem => item != null) ?? [];

  const countedItems = roomItems.filter((item) => countEntered(selectedDraft[item.id])).length;
  const canSave = countedItems > 0;
  const allCounted = roomItems.length > 0 && countedItems === roomItems.length;
  const progressPercent =
    roomItems.length > 0 ? Math.round((countedItems / roomItems.length) * 100) : 0;
  const roomsReadyToCount = rooms.filter((room) => room.itemIds.length > 0).length;

  return (
    <div className={`${CARD_CLASS} flex min-h-[28rem] flex-col`}>
      <div className="flex shrink-0 items-center gap-3 border-b border-border/80 px-5 py-3.5">
        <div className={CHART_ICON_BADGE_CLASS}>
          <ClipboardList className="size-4 text-text-muted" strokeWidth={1.75} />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight text-text-primary">
            Count what&apos;s on the shelf
          </p>
          <p className="text-xs text-text-muted">
            Pick a room, enter what you physically counted, then save when that room is done
          </p>
        </div>
      </div>

      {roomsReadyToCount === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-5 py-12 text-center">
          <p className="text-sm text-text-secondary">No rooms are ready to count yet.</p>
          <p className="max-w-md text-xs text-text-muted">
            Go to Setup rooms and assign items to each storage area first. You can only count items
            that belong to a room.
          </p>
          <button
            type="button"
            onClick={onGoToRoomsTab}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-text-primary underline-offset-4 hover:underline"
          >
            Set up rooms
            <ArrowRight className="size-4" strokeWidth={2} />
          </button>
        </div>
      ) : (
        <>
      {saveMessage ? (
        <p className="border-b border-border/60 bg-success/5 px-5 py-2.5 text-sm text-success">
          {saveMessage}
        </p>
      ) : null}

      <div className="grid min-h-0 flex-1 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <aside className="border-b border-border/80 lg:border-b-0 lg:border-r">
          <p className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-text-muted">
            Pick a room
          </p>
          {rooms.length === 0 ? (
            <p className="px-4 pb-4 text-sm text-text-muted">No rooms yet.</p>
          ) : (
            <ul className="px-2 pb-3 lg:pb-4">
              {rooms.map((room) => {
                const roomDraft = draftsByRoom[room.id] ?? {};
                const status = getRoomStatus(room, roomDraft, history);
                const isSelected = room.id === selectedRoomId;
                const needsSetup = status === "needs_setup";
                return (
                  <li key={room.id}>
                    <button
                      type="button"
                      onClick={() => {
                        if (needsSetup) {
                          onGoToRoomsTab();
                          return;
                        }
                        onSelectRoom(room.id);
                      }}
                      className={`flex w-full flex-col items-start gap-1 rounded-md px-3 py-2.5 text-left transition-colors ${
                        isSelected && !needsSetup
                          ? "bg-sidebar-active text-text-primary"
                          : "text-text-secondary hover:bg-surface-muted/80 hover:text-text-primary"
                      }`}
                    >
                      <span className="truncate text-sm font-medium">{room.name}</span>
                      <span className="text-xs text-text-muted">
                        {needsSetup
                          ? "Assign items first"
                          : `${room.itemIds.length} ${room.itemIds.length === 1 ? "item" : "items"}`}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusClass(status)}`}
                      >
                        {statusLabel(status)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <div className="flex min-h-0 flex-1 flex-col">
          {!selectedRoom ? (
            <div className="flex flex-1 items-center justify-center px-5 py-12 text-center">
              <p className="text-sm text-text-muted">Select a room to start counting.</p>
            </div>
          ) : roomItems.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-5 py-12 text-center">
              <p className="text-sm font-semibold text-text-primary">
                {selectedRoom.name} has no items yet
              </p>
              <p className="max-w-sm text-xs text-text-muted">
                Before you can count this room, choose which items are stored here.
              </p>
              <button
                type="button"
                onClick={onGoToRoomsTab}
                className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-text-primary shadow-sm transition-[background-color,box-shadow] hover:bg-accent-hover hover:shadow"
              >
                Assign items
                <ArrowRight className="size-4" strokeWidth={2} />
              </button>
            </div>
          ) : (
            <>
              <div className="border-b border-border/60 bg-surface-muted/30 px-5 py-3">
                <p className="text-sm font-medium text-text-primary">
                  Counting: {selectedRoom.name}
                </p>
                <p className="mt-0.5 text-xs text-text-muted">
                  Enter the quantity you see for each item. Save when you&apos;re done with this
                  room.
                </p>
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-xs text-text-muted">
                    <span>
                      {countedItems} of {roomItems.length} items entered
                    </span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-border/80">
                    <div
                      className="h-full rounded-full bg-accent transition-[width]"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-auto">
                <table className="w-full min-w-[36rem] text-sm">
                  <thead className="sticky top-0 z-10 bg-surface">
                    <tr className="border-b border-border/80 text-left text-[10px] font-medium uppercase tracking-[0.14em] text-text-muted">
                      <th className="px-5 py-2.5 font-medium">Item</th>
                      <th className="px-3 py-2.5 font-medium">Unit</th>
                      <th className="px-3 py-2.5 text-right font-medium">Last count</th>
                      <th className="px-3 py-2.5 text-right font-medium">Par</th>
                      <th className="px-5 py-2.5 text-right font-medium">What you count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roomItems.map((item) => (
                      <tr key={item.id} className="border-b border-border/60 last:border-b-0">
                        <td className="px-5 py-3 font-medium text-text-primary">{item.name}</td>
                        <td className="px-3 py-3 text-text-muted">{item.reportingUnit}</td>
                        <td className="px-3 py-3 text-right text-text-secondary">{item.onHand}</td>
                        <td className="px-3 py-3 text-right text-text-muted">{item.par}</td>
                        <td className="px-5 py-3 text-right">
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={selectedDraft[item.id] ?? ""}
                            onChange={(event) => {
                              const raw = event.target.value;
                              onCountChange(item.id, raw === "" ? "" : Number(raw));
                            }}
                            placeholder="0"
                            className={inputClassName}
                            aria-label={`What you counted for ${item.name}`}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-t border-border/80 bg-surface px-5 py-3.5">
                <p className="text-sm text-text-muted">
                  {allCounted
                    ? "All items entered — ready to save"
                    : `${roomItems.length - countedItems} item${roomItems.length - countedItems === 1 ? "" : "s"} still need a count`}
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    setSaving(true);
                    try {
                      await onSaveRoomCheck();
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={!canSave || saving}
                  className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-text-primary shadow-sm transition-[background-color,box-shadow] hover:bg-accent-hover hover:shadow disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-accent disabled:hover:shadow-none"
                >
                  {saving ? "Saving…" : `Save ${selectedRoom.name} check`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
        </>
      )}
    </div>
  );
}
