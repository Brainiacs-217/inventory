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
    .select("*, recipe_ingredients(id)")
    .eq("organization_id", organizationId)
    .order("name");

  if (error) return [];

  return (data ?? []).map((row) =>
    mapRecipeRowToRecipe(row as Tables<"recipes"> & { recipe_ingredients: { id: string }[] }),
  );
}
