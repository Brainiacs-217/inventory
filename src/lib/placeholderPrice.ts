/** Stable dummy dollar amount until real costing is wired up. */
export function placeholderPrice(seed: string, minCents: number, spanCents: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 33 + seed.charCodeAt(i)) >>> 0;
  }
  return (minCents + (hash % spanCents)) / 100;
}

export function placeholderBatchPrice(batchId: string): number {
  return placeholderPrice(`batch:${batchId}`, 650, 4200);
}

export function placeholderRecipeCog(recipeId: string): number {
  return placeholderPrice(`recipe:${recipeId}`, 125, 900);
}
