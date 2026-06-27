"use client";

import { Plug } from "lucide-react";

const CARD_CLASS =
  "w-full overflow-hidden rounded-xl border border-border/80 bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-4px_rgba(0,0,0,0.08)]";

export function SquareConnectBanner() {
  return (
    <div className={CARD_CLASS}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-surface-muted">
            <Plug className="size-4 text-text-muted" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-tight text-text-primary">
              Square
              <span className="font-normal text-text-muted"> · not connected</span>
            </p>
            <p className="text-xs text-text-muted">
              Connect Square to import sales and fill in the charts below.
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled
          className="inline-flex shrink-0 items-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-text-primary opacity-60 shadow-sm disabled:cursor-not-allowed"
        >
          Connect Square
        </button>
      </div>
    </div>
  );
}
