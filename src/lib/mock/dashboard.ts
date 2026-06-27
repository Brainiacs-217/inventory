import type { MonthlyProfit, RecipeSales } from "@/types/dashboard";

const MOCK_RECIPE_BASE = [
  {
    recipeId: "3",
    name: "Cheeseburger",
    foodCost: 2.8,
    menuPrice: 12.0,
    quantitySold: 186,
  },
  {
    recipeId: "2",
    name: "Brown Sugar Boba Milk",
    foodCost: 1.45,
    menuPrice: 6.5,
    quantitySold: 312,
  },
  {
    recipeId: "1",
    name: "Classic Milk Tea",
    foodCost: 1.15,
    menuPrice: 5.5,
    quantitySold: 278,
  },
  {
    recipeId: "5",
    name: "Thai Tea",
    foodCost: 1.2,
    menuPrice: 5.75,
    quantitySold: 201,
  },
  {
    recipeId: "4",
    name: "Fries",
    foodCost: 0.65,
    menuPrice: 4.0,
    quantitySold: 245,
  },
];

function buildMonthlyProfit(): MonthlyProfit[] {
  const monthlyTotals: Array<number | null> = [
    26_400, 27_800, 31_200, 29_500, 32_100, 33_400, null,
  ];
  const today = new Date();

  return monthlyTotals.map((profit, index) => {
    const date = new Date(today.getFullYear(), today.getMonth() - (monthlyTotals.length - 1 - index), 1);
    return {
      date: date.toISOString().slice(0, 10),
      profit,
    };
  });
}

function buildRecipeSales(): RecipeSales[] {
  return MOCK_RECIPE_BASE.map(({ recipeId, name, foodCost, menuPrice, quantitySold }) => ({
    recipeId,
    name,
    quantitySold,
    profit: (menuPrice - foodCost) * quantitySold,
  })).sort((a, b) => b.profit - a.profit);
}

export const MOCK_MONTHLY_PROFIT = buildMonthlyProfit();
export const MOCK_RECIPE_SALES = buildRecipeSales();
