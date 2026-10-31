export type MonthlyProfit = {
  date: string;
  profit: number | null;
};

export type SalesPeriod = "day" | "week" | "month" | "year";

/** Revenue and profit for one recipe. Amounts are dollars. */
export type RecipeSales = {
  id: string;
  name: string;
  revenue: number;
  profit: number;
  quantitySold: number;
};

export type RecipeSalesByPeriod = Record<SalesPeriod, RecipeSales[]>;
