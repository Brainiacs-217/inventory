"use server";

import { revalidatePath } from "next/cache";

import { getOrganizationItems } from "@/lib/items/queries";
import {
  computeTotalCost,
  computeTotalIngredientCost,
} from "@/lib/recipeCost";
import {
  mapFormToRecipeInsert,
  mapRecipeRowToRecipe,
} from "@/lib/recipes/mappers";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { CreateRecipeFormValues } from "@/types/recipe";
import type { Tables } from "@/types/database";

type ActionError = { error: string };
type ActionSuccess<T> = { data: T };

async function verifyOrgMembership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("profile_id", userId)
    .maybeSingle();

  return data != null;
}

export async function createRecipe(
  organizationId: string,
  values: CreateRecipeFormValues,
): Promise<ActionError | ActionSuccess<{ recipeId: string }>> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured. Check your environment variables." };
  }

  if (!organizationId) {
    return { error: "Select an organization before adding recipes." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to create a recipe." };
  }

  const isMember = await verifyOrgMembership(supabase, organizationId, user.id);
  if (!isMember) {
    return { error: "You do not have access to this organization." };
  }

  const catalogItems = await getOrganizationItems(organizationId);
  const itemsById = new Map(catalogItems.map((item) => [item.id, item]));
  const totalIngredientCost = computeTotalIngredientCost(values.ingredients, itemsById);
  const foodCost = computeTotalCost(totalIngredientCost, parseFloat(values.miscCost) || 0);

  const { data: recipe, error: recipeError } = await supabase
    .from("recipes")
    .insert(mapFormToRecipeInsert(values, organizationId, foodCost))
    .select()
    .single();

  if (recipeError) {
    return { error: recipeError.message };
  }

  const ingredientRows = values.ingredients.map((ingredient, index) => ({
    recipe_id: recipe.id,
    item_id: ingredient.itemId,
    quantity: parseFloat(ingredient.quantity),
    unit: ingredient.unit,
    sort_order: index,
  }));

  const { error: ingredientsError } = await supabase
    .from("recipe_ingredients")
    .insert(ingredientRows);

  if (ingredientsError) {
    await supabase.from("recipes").delete().eq("id", recipe.id);
    return { error: ingredientsError.message };
  }

  revalidatePath("/recipes");
  return { data: { recipeId: recipe.id } };
}

export async function deleteRecipes(
  organizationId: string,
  recipeIds: string[],
): Promise<ActionError | ActionSuccess<{ deletedIds: string[] }>> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured. Check your environment variables." };
  }

  if (!organizationId || recipeIds.length === 0) {
    return { data: { deletedIds: [] } };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to delete recipes." };
  }

  const { data, error } = await supabase
    .from("recipes")
    .delete()
    .eq("organization_id", organizationId)
    .in("id", recipeIds)
    .select("id");

  if (error) {
    return { error: error.message };
  }

  const deletedIds = (data ?? []).map((row) => row.id);
  if (deletedIds.length === 0) {
    return { error: "No recipes were deleted." };
  }

  revalidatePath("/recipes");
  return { data: { deletedIds } };
}
