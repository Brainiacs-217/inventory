"use server";

import { revalidatePath } from "next/cache";

import {
  mapFormToRecipeIngredientInserts,
  mapFormToRecipeInsert,
} from "@/lib/recipes/mappers";
import { setRecipeSquareItems } from "@/lib/sql/square/items";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { CreateRecipeFormValues } from "@/types/recipe";

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

  const { data: recipe, error: recipeError } = await supabase
    .from("recipes")
    .insert(mapFormToRecipeInsert(values, organizationId))
    .select("id")
    .single();

  if (recipeError) {
    return { error: recipeError.message };
  }

  const ingredientRows = mapFormToRecipeIngredientInserts(
    Number(recipe.id),
    values.ingredients,
  );
  const { error: ingredientsError } = await supabase
    .from("recipe_ingredients")
    .insert(ingredientRows);

  if (ingredientsError) {
    await supabase.from("recipes").delete().eq("id", recipe.id);
    return { error: ingredientsError.message };
  }

  revalidatePath("/recipes");
  return { data: { recipeId: String(recipe.id) } };
}

export async function updateRecipe(
  organizationId: string,
  recipeId: string,
  values: CreateRecipeFormValues,
): Promise<ActionError | ActionSuccess<{ recipeId: string }>> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured. Check your environment variables." };
  }

  if (!organizationId) {
    return { error: "Select an organization before editing recipes." };
  }

  if (!values.name.trim()) return { error: "Recipe name is required." };
  if (values.ingredients.length === 0) return { error: "Add at least one item or batch." };

  const numericId = Number(recipeId);
  if (!Number.isFinite(numericId)) return { error: "Recipe was not found." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to edit a recipe." };
  }

  const isMember = await verifyOrgMembership(supabase, organizationId, user.id);
  if (!isMember) {
    return { error: "You do not have access to this organization." };
  }

  const { data: existing, error: existingError } = await supabase
    .from("recipes")
    .select("id")
    .eq("id", numericId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (existingError) return { error: existingError.message };
  if (!existing) return { error: "Recipe was not found." };

  const { error: recipeError } = await supabase
    .from("recipes")
    .update({ name: values.name.trim() })
    .eq("id", numericId)
    .eq("organization_id", organizationId);

  if (recipeError) return { error: recipeError.message };

  const { error: deleteError } = await supabase
    .from("recipe_ingredients")
    .delete()
    .eq("recipe_id", numericId);

  if (deleteError) return { error: deleteError.message };

  const { error: ingredientsError } = await supabase
    .from("recipe_ingredients")
    .insert(mapFormToRecipeIngredientInserts(numericId, values.ingredients));

  if (ingredientsError) return { error: ingredientsError.message };

  try {
    const linkResult = await setRecipeSquareItems(
      organizationId,
      numericId,
      values.squareItems.map((item) => item.id),
    );
    if ("error" in linkResult) return linkResult;
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to link Square items.",
    };
  }

  revalidatePath("/recipes");
  return { data: { recipeId } };
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

  const numericIds = recipeIds.map((id) => Number(id)).filter((id) => Number.isFinite(id));

  const { data, error } = await supabase
    .from("recipes")
    .delete()
    .eq("organization_id", organizationId)
    .in("id", numericIds)
    .select("id");

  if (error) {
    return { error: error.message };
  }

  const deletedIds = (data ?? []).map((row) => String(row.id));
  if (deletedIds.length === 0) {
    return { error: "No recipes were deleted." };
  }

  revalidatePath("/recipes");
  return { data: { deletedIds } };
}
