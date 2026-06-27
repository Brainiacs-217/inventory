import type { InventoryCount } from "@/types/inventory";

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

export const MOCK_INVENTORY_COUNTS: InventoryCount[] = [
  {
    itemId: "2",
    name: "Boba",
    reportingUnit: "tub (8.4lbs)",
    onHand: 0,
    par: 3,
    lastCountedAt: daysAgo(1),
  },
  {
    itemId: "3",
    name: "Milk",
    reportingUnit: "bag (2.2lbs)",
    onHand: 2,
    par: 10,
    lastCountedAt: daysAgo(2),
  },
  {
    itemId: "1",
    name: "Bud Light",
    reportingUnit: "bottle (12fl. oz)",
    onHand: 48,
    par: 24,
    lastCountedAt: daysAgo(11),
  },
  {
    itemId: "5",
    name: "Popping Boba",
    reportingUnit: "tub (8.4lbs)",
    onHand: 4,
    par: 3,
    lastCountedAt: null,
  },
  {
    itemId: "6",
    name: "Burger Buns",
    reportingUnit: "pack (12 ct)",
    onHand: 0,
    par: 8,
    lastCountedAt: daysAgo(0),
  },
  {
    itemId: "7",
    name: "Black Tea Leaves",
    reportingUnit: "bag (5 lbs)",
    onHand: 3,
    par: 6,
    lastCountedAt: daysAgo(4),
  },
  {
    itemId: "8",
    name: "Brown Sugar Syrup",
    reportingUnit: "bottle (64 fl oz)",
    onHand: 1,
    par: 4,
    lastCountedAt: daysAgo(1),
  },
];
