export function calculateItemCost(
  price: string,
  caseSize: string,
): number | null {
  const parsedPrice = parseFloat(price);
  if (!price.trim() || Number.isNaN(parsedPrice) || parsedPrice < 0) {
    return null;
  }

  const trimmedCaseSize = caseSize.trim();
  const divisor =
    trimmedCaseSize === ""
      ? 1
      : Math.max(parseFloat(trimmedCaseSize), 1);

  if (Number.isNaN(divisor) || divisor <= 0) {
    return null;
  }

  return parsedPrice / divisor;
}

export function formatCostValue(cost: number): string {
  return cost.toFixed(2);
}
