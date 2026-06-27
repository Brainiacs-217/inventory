"use client";

import { Plug } from "lucide-react";
import { useState } from "react";

const CARD_CLASS =
  "w-full overflow-hidden rounded-xl border border-border/80 bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-4px_rgba(0,0,0,0.08)]";

export function SquareConnectBanner() {
  const [clicked, setClicked] = useState(false);

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
              {clicked
                ? "Not available yet."
                : "Import sales to fill in the charts below."}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setClicked(true)}
          disabled={clicked}
          className="inline-flex shrink-0 items-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-text-primary shadow-sm transition-[background-color,box-shadow] hover:bg-accent-hover hover:shadow disabled:cursor-default disabled:opacity-60 disabled:hover:bg-accent disabled:hover:shadow-sm"
        >
          Connect Square
        </button>
      </div>
    </div>
  );
}
