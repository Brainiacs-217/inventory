"use server";

import { searchSquareItemMatches } from "@/lib/sql/square/items";
import type { SquareItemMatch } from "@/types/recipe";

type ActionError = { error: string };
type ActionSuccess<T> = { data: T };

export async function searchSquareItems(
  organizationId: string,
  query: string,
): Promise<ActionError | ActionSuccess<SquareItemMatch[]>> {
  if (!organizationId) {
    return { error: "Select an organization before searching Square items." };
  }

  try {
    const matches = await searchSquareItemMatches(organizationId, query);
    return { data: matches };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to search Square items.",
    };
  }
}
