"use client";

import { useCallback, useEffect, useState } from "react";

import { StorageCheckHistoryPanel } from "@/component/StorageCheckHistoryPanel";
import { StorageCountPanel } from "@/component/StorageCountPanel";
import { StorageRoomsPanel } from "@/component/StorageRoomsPanel";
import type {
  CreateStorageRoomFormValues,
  InventoryTab,
  SavedRoomCheck,
  StorageCatalogItem,
  StorageRoom,
} from "@/types/storage";

const tabs: { id: InventoryTab; label: string; step: number }[] = [
  { id: "rooms", label: "Setup rooms", step: 1 },
  { id: "count", label: "Count", step: 2 },
  { id: "history", label: "History", step: 3 },
];

type RoomDrafts = Record<string, Record<string, number | "">>;

function countEntered(value: number | "" | undefined): value is number {
  return value !== "" && value !== undefined;
}

export function InventoryPage() {
  const [activeTab, setActiveTab] = useState<InventoryTab>("rooms");
  const [rooms, setRooms] = useState<StorageRoom[]>([]);
  const [catalogItems, setCatalogItems] = useState<StorageCatalogItem[]>([]);
  const [history, setHistory] = useState<SavedRoomCheck[]>([]);
  const [draftsByRoom, setDraftsByRoom] = useState<RoomDrafts>({});
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!saveMessage) return;
    const timer = window.setTimeout(() => setSaveMessage(null), 4000);
    return () => window.clearTimeout(timer);
  }, [saveMessage]);

  const handleAddRoom = useCallback((values: CreateStorageRoomFormValues): StorageRoom => {
    const room: StorageRoom = {
      id: crypto.randomUUID(),
      name: values.name.trim(),
      description: values.description.trim() || undefined,
      itemIds: [],
    };
    setRooms((current) => [...current, room]);
    setSelectedRoomId(room.id);
    return room;
  }, []);

  const handleUpdateRoom = useCallback((roomId: string, values: CreateStorageRoomFormValues) => {
    setRooms((current) =>
      current.map((room) =>
        room.id === roomId
          ? {
              ...room,
              name: values.name.trim(),
              description: values.description.trim() || undefined,
            }
          : room,
      ),
    );
  }, []);

  const handleDeleteRoom = useCallback((roomId: string) => {
    setRooms((current) => current.filter((room) => room.id !== roomId));
    setDraftsByRoom((current) => {
      const next = { ...current };
      delete next[roomId];
      return next;
    });
    setSelectedRoomId((current) => (current === roomId ? null : current));
  }, []);

  const handleUpdateRoomItems = useCallback((roomId: string, itemIds: string[]) => {
    setRooms((current) =>
      current.map((room) => (room.id === roomId ? { ...room, itemIds } : room)),
    );
  }, []);

  const handleCountChange = useCallback(
    (itemId: string, value: number | "") => {
      if (!selectedRoomId) return;
      setDraftsByRoom((current) => ({
        ...current,
        [selectedRoomId]: {
          ...(current[selectedRoomId] ?? {}),
          [itemId]: value,
        },
      }));
    },
    [selectedRoomId],
  );

  const handleSaveRoomCheck = useCallback(() => {
    if (!selectedRoomId) return;

    const room = rooms.find((entry) => entry.id === selectedRoomId);
    if (!room) return;

    const draft = draftsByRoom[selectedRoomId] ?? {};
    const catalogById = new Map(catalogItems.map((item) => [item.id, item]));

    const entries = room.itemIds
      .map((itemId) => {
        const countedQty = draft[itemId];
        if (!countEntered(countedQty)) return null;

        const item = catalogById.get(itemId);
        if (!item) return null;

        return {
          itemId: item.id,
          name: item.name,
          reportingUnit: item.reportingUnit,
          previousOnHand: item.onHand,
          countedQty,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry != null);

    if (entries.length === 0) return;

    const savedCheck: SavedRoomCheck = {
      id: crypto.randomUUID(),
      roomId: room.id,
      roomName: room.name,
      savedAt: new Date().toISOString(),
      savedBy: "",
      entries,
    };

    setHistory((current) => [savedCheck, ...current]);
    setCatalogItems((current) =>
      current.map((item) => {
        const entry = entries.find((saved) => saved.itemId === item.id);
        return entry ? { ...item, onHand: entry.countedQty } : item;
      }),
    );
    setDraftsByRoom((current) => {
      const next = { ...current };
      delete next[selectedRoomId];
      return next;
    });
    setSaveMessage(`${room.name} check saved.`);
  }, [catalogItems, draftsByRoom, rooms, selectedRoomId]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="inline-flex w-fit rounded-lg border border-border/80 bg-surface p-1 shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-sidebar-active text-text-primary shadow-sm"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            <span className="mr-1 font-bold">{tab.step}.</span>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "rooms" ? (
        <StorageRoomsPanel
          rooms={rooms}
          catalogItems={catalogItems}
          onAddRoom={handleAddRoom}
          onUpdateRoom={handleUpdateRoom}
          onDeleteRoom={handleDeleteRoom}
          onUpdateRoomItems={handleUpdateRoomItems}
        />
      ) : null}

      {activeTab === "count" ? (
        <StorageCountPanel
          rooms={rooms}
          catalogItems={catalogItems}
          selectedRoomId={selectedRoomId}
          draftsByRoom={draftsByRoom}
          history={history}
          saveMessage={saveMessage}
          onSelectRoom={setSelectedRoomId}
          onCountChange={handleCountChange}
          onSaveRoomCheck={handleSaveRoomCheck}
          onGoToRoomsTab={() => setActiveTab("rooms")}
        />
      ) : null}

      {activeTab === "history" ? (
        <StorageCheckHistoryPanel history={history} rooms={rooms} />
      ) : null}
    </div>
  );
}
