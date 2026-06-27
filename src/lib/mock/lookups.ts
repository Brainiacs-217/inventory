export const CATEGORIES = [
  "Beer",
  "Dairy",
  "Toppings",
  "Produce",
  "Dry Goods",
] as const;

export const SUBCATEGORIES_BY_CATEGORY: Record<string, string[]> = {
  Beer: ["Lager", "Ale", "IPA", "Stout"],
  Dairy: ["Milk", "Cheese", "Cream"],
  Toppings: ["Jelly", "Syrup", "Powder"],
  Produce: ["Fruit", "Vegetable", "Herb"],
  "Dry Goods": ["Flour", "Sugar", "Rice"],
};

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

export const WEIGHT_UNITS = ["oz", "lb", "g", "kg"] as const;

export const CONVERSION_UNITS = [
  ...UNITS_OF_MEASURE,
  ...BASE_UNITS,
  ...REPORTING_UNITS,
] as const;

export const RECIPE_CATEGORIES = [
  "Beverages",
  "Entrees",
  "Sides",
  "Desserts",
  "Prep",
] as const;
