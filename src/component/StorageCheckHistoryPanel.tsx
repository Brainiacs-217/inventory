"use client";

import { ChevronDown, History } from "lucide-react";
import { useMemo, useState } from "react";

import { CHART_ICON_BADGE_CLASS } from "@/lib/chartInteraction";
import type { SavedRoomCheck, StorageRoom } from "@/types/storage";

const CARD_CLASS =
  "w-full overflow-hidden rounded-xl border border-border/80 bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-4px_rgba(0,0,0,0.08)]";

const selectClassName =
  "rounded-sm border border-border/80 bg-surface px-2.5 py-1.5 text-sm text-text-primary shadow-sm transition-[border-color,box-shadow] outline-none hover:border-text-muted/30 focus:border-accent/50 focus:ring-2 focus:ring-accent/15";

type StorageCheckHistoryPanelProps = {
  history: SavedRoomCheck[];
  rooms: StorageRoom[];
};

function formatSavedAt(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatVariance(previous: number, counted: number): string {
  const diff = counted - previous;
  if (diff === 0) return "0";
  return diff > 0 ? `+${diff}` : `${diff}`;
}

function varianceClass(previous: number, counted: number): string {
  const diff = counted - previous;
  if (diff > 0) return "text-success";
  if (diff < 0) return "text-error";
  return "text-text-muted";
}

export function StorageCheckHistoryPanel({ history, rooms }: StorageCheckHistoryPanelProps) {
  const [roomFilter, setRoomFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredHistory = useMemo(() => {
    const sorted = [...history].sort(
      (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
    );
    if (roomFilter === "all") return sorted;
    return sorted.filter((check) => check.roomId === roomFilter);
  }, [history, roomFilter]);

  return (
    <div className={CARD_CLASS}>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-border/80 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className={CHART_ICON_BADGE_CLASS}>
            <History className="size-4 text-text-muted" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight text-text-primary">
              Review past checks
            </p>
            <p className="text-xs text-text-muted">Every saved room check appears here</p>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-text-muted">
          <span className="sr-only">Filter by room</span>
          <select
            value={roomFilter}
            onChange={(event) => setRoomFilter(event.target.value)}
            className={selectClassName}
            aria-label="Filter by room"
          >
            <option value="all">All rooms</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {filteredHistory.length === 0 ? (
        <p className="px-5 py-8 text-sm text-text-muted">No room checks saved yet.</p>
      ) : (
        <ul className="divide-y divide-border/60">
          {filteredHistory.map((check) => {
            const isExpanded = expandedId === check.id;
            return (
              <li key={check.id}>
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : check.id)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-3.5 text-left transition-colors hover:bg-surface-muted/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text-primary">{check.roomName}</p>
                    <p className="mt-0.5 text-xs text-text-muted">
                      {formatSavedAt(check.savedAt)}
                    </p>
                  </div>
                  <ChevronDown
                    aria-hidden
                    className={`size-4 shrink-0 text-text-muted transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isExpanded ? (
                  <div className="border-t border-border/60 bg-surface-muted/20 px-5 py-3">
                    <table className="w-full min-w-[32rem] text-sm">
                      <thead>
                        <tr className="text-left text-[10px] font-medium uppercase tracking-[0.14em] text-text-muted">
                          <th className="pb-2 font-medium">Item</th>
                          <th className="pb-2 font-medium">Unit</th>
                          <th className="pb-2 text-right font-medium">Previous</th>
                          <th className="pb-2 text-right font-medium">Counted</th>
                          <th className="pb-2 text-right font-medium">Variance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {check.entries.map((entry) => (
                          <tr key={entry.itemId} className="border-t border-border/40">
                            <td className="py-2.5 font-medium text-text-primary">{entry.name}</td>
                            <td className="py-2.5 text-text-muted">{entry.reportingUnit}</td>
                            <td className="py-2.5 text-right text-text-secondary">
                              {entry.previousOnHand}
                            </td>
                            <td className="py-2.5 text-right text-text-primary">
                              {entry.countedQty}
                            </td>
                            <td
                              className={`py-2.5 text-right font-medium ${varianceClass(entry.previousOnHand, entry.countedQty)}`}
                            >
                              {formatVariance(entry.previousOnHand, entry.countedQty)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
