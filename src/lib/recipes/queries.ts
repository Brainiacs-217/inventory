import { mapRecipeRowToRecipe } from "@/lib/recipes/mappers";
import { createClient } from "@/lib/supabase/server";
import type { Recipe } from "@/types/recipe";
import type { Tables } from "@/types/database";

export async function getOrganizationRecipes(
  organizationId: string,
): Promise<Recipe[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("recipes")
    .select(
      "id, name, created_at, recipe_ingredients(id, item_id, batch_id, quantity, unit_id, role, note)",
    )
    .eq("organization_id", organizationId)
    .order("name");

  if (error) {
    console.error("Failed to load organization recipes:", error.message);
    return [];
  }

  return (data ?? []).map((row) =>
    mapRecipeRowToRecipe(
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
    ),
  );
}
