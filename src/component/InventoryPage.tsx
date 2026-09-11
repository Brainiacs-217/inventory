"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { StorageCountPanel } from "@/component/StorageCountPanel";
import { StorageRoomsPanel } from "@/component/StorageRoomsPanel";
import {
  createStorageRoom,
  deleteStorageRoom,
  saveRoomCount,
  updateStorageRoom,
  updateStorageRoomItems,
} from "@/lib/inventory/actions";
import type {
  CreateStorageRoomFormValues,
  InventoryTab,
  StorageCatalogItem,
  StorageRoom,
} from "@/types/storage";

const tabs: { id: InventoryTab; label: string; step: number }[] = [
  { id: "rooms", label: "Setup rooms", step: 1 },
  { id: "count", label: "Count", step: 2 },
];

type RoomDrafts = Record<string, Record<string, number | "">>;

function countEntered(value: number | "" | undefined): value is number {
  return value !== "" && value !== undefined;
}

type InventoryPageProps = {
  organizationId: string | null;
  rooms: StorageRoom[];
  catalogItems: StorageCatalogItem[];
};

export function InventoryPage({
  organizationId,
  rooms,
  catalogItems,
}: InventoryPageProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<InventoryTab>("rooms");
  const [draftsByRoom, setDraftsByRoom] = useState<RoomDrafts>({});
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!saveMessage) return;
    const timer = window.setTimeout(() => setSaveMessage(null), 4000);
    return () => window.clearTimeout(timer);
  }, [saveMessage]);

  const handleAddRoom = useCallback(
    async (values: CreateStorageRoomFormValues): Promise<StorageRoom> => {
      if (!organizationId) {
        throw new Error("Select an organization before adding storage rooms.");
      }

      const result = await createStorageRoom(organizationId, values);
      if ("error" in result) {
        throw new Error(result.error);
      }

      router.refresh();

      return {
        id: result.data.roomId,
        name: values.name.trim(),
        description: values.description.trim() || undefined,
        itemIds: [],
      };
    },
    [organizationId, router],
  );

  const handleUpdateRoom = useCallback(
    async (roomId: string, values: CreateStorageRoomFormValues) => {
      if (!organizationId) return;

      const result = await updateStorageRoom(organizationId, roomId, values);
      if ("error" in result) {
        throw new Error(result.error);
      }

      router.refresh();
    },
    [organizationId, router],
  );

  const handleDeleteRoom = useCallback(
    async (roomId: string) => {
      if (!organizationId) return;

      const result = await deleteStorageRoom(organizationId, roomId);
      if ("error" in result) {
        throw new Error(result.error);
      }

      setDraftsByRoom((current) => {
        const next = { ...current };
        delete next[roomId];
        return next;
      });
      setSelectedRoomId((current) => (current === roomId ? null : current));
      router.refresh();
    },
    [organizationId, router],
  );

  const handleUpdateRoomItems = useCallback(
    async (roomId: string, itemIds: string[]) => {
      if (!organizationId) return;

      const result = await updateStorageRoomItems(organizationId, roomId, itemIds);
      if ("error" in result) {
        throw new Error(result.error);
      }

      router.refresh();
    },
    [organizationId, router],
  );

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

  const handleSaveRoomCount = useCallback(async () => {
    if (!organizationId || !selectedRoomId) return;

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
          countedQty,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry != null);

    if (entries.length === 0) return;

    const result = await saveRoomCount(organizationId, entries);
    if ("error" in result) {
      throw new Error(result.error);
    }

    setDraftsByRoom((current) => {
      const next = { ...current };
      delete next[selectedRoomId];
      return next;
    });
    setSaveMessage(`${room.name} count saved.`);
    router.refresh();
  }, [catalogItems, draftsByRoom, organizationId, rooms, router, selectedRoomId]);

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

      {!organizationId ? (
        <p className="text-sm text-text-muted">
          Select an organization in the sidebar to manage inventory.
        </p>
      ) : null}

      {activeTab === "rooms" && organizationId ? (
        <StorageRoomsPanel
          rooms={rooms}
          catalogItems={catalogItems}
          onAddRoom={handleAddRoom}
          onUpdateRoom={handleUpdateRoom}
          onDeleteRoom={handleDeleteRoom}
          onUpdateRoomItems={handleUpdateRoomItems}
        />
      ) : null}

      {activeTab === "count" && organizationId ? (
        <StorageCountPanel
          rooms={rooms}
          catalogItems={catalogItems}
          selectedRoomId={selectedRoomId}
          draftsByRoom={draftsByRoom}
          saveMessage={saveMessage}
          onSelectRoom={setSelectedRoomId}
          onCountChange={handleCountChange}
          onSaveRoomCount={handleSaveRoomCount}
          onGoToRoomsTab={() => setActiveTab("rooms")}
        />
      ) : null}
    </div>
  );
}
