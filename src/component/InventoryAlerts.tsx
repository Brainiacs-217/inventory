import Link from "next/link";

import {
  getAlertLabel,
  getInventoryAlerts,
  getShortDetail,
} from "@/lib/inventory/alerts";
import type { InventoryAlertType, InventoryCount } from "@/types/inventory";

const CARD_CLASS =
  "w-full overflow-hidden rounded-xl border border-border/80 bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-4px_rgba(0,0,0,0.08)]";

function statusClass(type: InventoryAlertType): string {
  if (type === "out_of_stock") return "text-error";
  return "text-text-muted";
}

type InventoryAlertsProps = {
  counts: InventoryCount[];
};

export function InventoryAlerts({ counts }: InventoryAlertsProps) {
  const alerts = getInventoryAlerts(counts);

  return (
    <div className={`${CARD_CLASS} flex h-full min-h-0 flex-col`}>
      <div className="flex shrink-0 items-baseline justify-between gap-4 px-5 py-3.5">
        <p className="text-sm font-semibold tracking-tight text-text-primary">
          Inventory
          {alerts.length > 0 ? (
            <span className="font-normal text-text-muted">
              {" "}
              · {alerts.length} flagged
            </span>
          ) : null}
        </p>
        <Link
          href="/inventory"
          className="shrink-0 text-xs text-text-muted underline-offset-4 transition-colors hover:text-text-primary hover:underline"
        >
          View inventory
        </Link>
      </div>

      {alerts.length === 0 ? (
        <p className="flex flex-1 items-start border-t border-border/60 px-5 py-3 text-sm text-text-muted">
          Nothing flagged.
        </p>
      ) : (
        <ul className="min-h-0 flex-1 overflow-y-auto border-t border-border/60">
          {alerts.map((alert) => (
            <li
              key={`${alert.itemId}-${alert.type}`}
              className="flex items-baseline justify-between gap-6 border-b border-border/60 px-5 py-2.5 last:border-b-0"
            >
              <p className="min-w-0 truncate text-sm text-text-primary">
                {alert.name}
                <span className="text-text-muted">
                  {" "}
                  · {getShortDetail(alert)}
                </span>
              </p>
              <span
                className={`shrink-0 text-xs ${statusClass(alert.type)}`}
              >
                {getAlertLabel(alert.type)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
