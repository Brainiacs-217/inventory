export type MonthlyProfit = {
  date: string;
  profit: number | null;
};

export type RecipeSales = {
  recipeId: string;
  name: string;
  profit: number;
  quantitySold: number;
};
