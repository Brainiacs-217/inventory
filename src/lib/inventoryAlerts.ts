import type { InventoryAlert, InventoryAlertType, InventoryCount } from "@/types/inventory";

const STALE_COUNT_DAYS = 7;

const ALERT_PRIORITY: Record<InventoryAlertType, number> = {
  out_of_stock: 0,
  below_par: 1,
  stale_count: 2,
};

function daysSince(date: string): number {
  const then = new Date(`${date}T12:00:00`);
  const now = new Date();
  const diffMs = now.getTime() - then.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function isStaleCount(lastCountedAt: string | null): boolean {
  if (!lastCountedAt) return true;
  return daysSince(lastCountedAt) > STALE_COUNT_DAYS;
}

function getAlertCandidates(count: InventoryCount): InventoryAlert[] {
  const alerts: InventoryAlert[] = [];
  const base = {
    itemId: count.itemId,
    name: count.name,
    reportingUnit: count.reportingUnit,
    onHand: count.onHand,
    par: count.par,
    lastCountedAt: count.lastCountedAt,
  };

  if (count.onHand === 0) {
    alerts.push({ ...base, type: "out_of_stock" });
    return alerts;
  }

  if (count.onHand < count.par) {
    alerts.push({ ...base, type: "below_par" });
  }

  if (isStaleCount(count.lastCountedAt)) {
    alerts.push({ ...base, type: "stale_count" });
  }

  return alerts;
}

export function getInventoryAlerts(counts: InventoryCount[]): InventoryAlert[] {
  return counts
    .flatMap(getAlertCandidates)
    .sort((a, b) => {
      const priorityDiff = ALERT_PRIORITY[a.type] - ALERT_PRIORITY[b.type];
      if (priorityDiff !== 0) return priorityDiff;
      return a.name.localeCompare(b.name);
    });
}

export function formatLastCounted(lastCountedAt: string | null): string {
  if (!lastCountedAt) return "Never counted";
  const days = daysSince(lastCountedAt);
  if (days === 0) return "Counted today";
  if (days === 1) return "Counted yesterday";
  return `Counted ${days} days ago`;
}

export function getShortDetail(alert: InventoryAlert): string {
  switch (alert.type) {
    case "out_of_stock":
      return `${alert.onHand} of ${alert.par}`;
    case "below_par":
      return `${alert.onHand} of ${alert.par}`;
    case "stale_count":
      return formatLastCounted(alert.lastCountedAt);
  }
}

export function getAlertDetail(alert: InventoryAlert): string {
  switch (alert.type) {
    case "out_of_stock":
      return `0 on hand · par ${alert.par} ${alert.reportingUnit}`;
    case "below_par":
      return `${alert.onHand} on hand · par ${alert.par} ${alert.reportingUnit}`;
    case "stale_count":
      return formatLastCounted(alert.lastCountedAt);
  }
}

export function getAlertLabel(type: InventoryAlertType): string {
  switch (type) {
    case "out_of_stock":
      return "Out of stock";
    case "below_par":
      return "Below par";
    case "stale_count":
      return "Needs count";
  }
}
