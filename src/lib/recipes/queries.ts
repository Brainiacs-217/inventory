import { mapRecipeRowToRecipe } from "@/lib/recipes/mappers";
import { listRecipeCosts } from "@/lib/sql/recipes/queries";
import { createClient } from "@/lib/supabase/server";
import type { Recipe } from "@/types/recipe";
import type { Tables } from "@/types/database";

function parseCost(value: number | string | null | undefined): number | null {
  if (value == null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function loadRecipeCosts(
  organizationId: string,
): Promise<Map<string, number | null>> {
  const rows = await listRecipeCosts(organizationId);
  return new Map(rows.map((row) => [row.recipe_id, parseCost(row.cost_per_recipe)]));
}

export async function getOrganizationRecipes(
  organizationId: string,
): Promise<Recipe[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const [{ data, error }, costs] = await Promise.all([
    supabase
      .from("recipes")
      .select(
        "id, name, created_at, recipe_ingredients(id, item_id, batch_id, quantity, unit_id, role, note)",
      )
      .eq("organization_id", organizationId)
      .order("name"),
    loadRecipeCosts(organizationId),
  ]);

  if (error) {
    console.error("Failed to load organization recipes:", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const recipe = mapRecipeRowToRecipe(
      row as Tables<"recipes"> & {
        recipe_ingredients: {
          id: number;
          item_id: number | null;
          batch_id: number | null;
          quantity: number;
          unit_id: number;
          role: string;
          note: string | null;
        }[];
      },
    );
    return { ...recipe, cog: costs.get(recipe.id) ?? null };
  });
}
