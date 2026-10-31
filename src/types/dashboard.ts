export type MonthlyProfit = {
  date: string;
  profit: number | null;
};

export type SalesPeriod = "day" | "week" | "month" | "year";

export type RecipeSales = {
  id: string;
  name: string;
  sales: number;
  profit: number | null;
  quantitySold: number;
};

export type RecipeSalesByPeriod = Record<SalesPeriod, RecipeSales[]>;
