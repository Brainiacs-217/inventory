export const ITEM_CATEGORIES = ["Food", "Beverage", "Supply"] as const;

export type ItemCategory = (typeof ITEM_CATEGORIES)[number];

export const BEVERAGE_SUB_CATEGORIES = [
  "Beer",
  "Wine",
  "Spirits",
  "Soft Drink",
  "Juice",
  "Water",
  "Other",
] as const;

export const VENDORS = [
  "August A Busch Co",
  "Boba Wholesale Co",
  "Bay Area Foods",
  "Local Produce Co",
  "Dry Goods Supply",
] as const;

export const UNITS_OF_MEASURE = ["fl. oz", "oz", "lb", "gal", "each"] as const;

export const BASE_UNITS = ["oz", "lb", "each"] as const;

export const REPORTING_UNITS = ["bottle", "tub", "bag", "case", "each"] as const;
