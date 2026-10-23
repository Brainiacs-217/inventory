"use server";

import { revalidatePath } from "next/cache";

import {
  mapFormToBatchIngredientInserts,
  mapFormToBatchInsert,
} from "@/lib/batches/mappers";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { CreateBatchFormValues } from "@/types/batch";

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

function validateBatch(values: CreateBatchFormValues): string | null {
  if (!values.name.trim()) return "Batch name is required.";

  const yieldQuantity = Number(values.yieldQuantity);
  if (!Number.isFinite(yieldQuantity) || yieldQuantity <= 0) {
    return "Yield must be greater than 0.";
  }

  if (!Number.isFinite(Number(values.yieldUnitId))) {
    return "Yield unit is required.";
  }

  if (values.ingredients.length === 0) return "Add at least one item.";

  for (const ingredient of values.ingredients) {
    const quantity = Number(ingredient.quantity);
    if (
      !Number.isFinite(Number(ingredient.itemId)) ||
      !Number.isFinite(Number(ingredient.unitId)) ||
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      return "Each line needs an item, quantity greater than 0, and unit.";
    }
  }

  return null;
}

export async function createBatch(
  organizationId: string,
  values: CreateBatchFormValues,
): Promise<ActionError | ActionSuccess<{ batchId: string }>> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured. Check your environment variables." };
  }

  if (!organizationId) {
    return { error: "Select an organization before adding batches." };
  }

  const validationError = validateBatch(values);
  if (validationError) return { error: validationError };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to create a batch." };
  }

  const isMember = await verifyOrgMembership(supabase, organizationId, user.id);
  if (!isMember) {
    return { error: "You do not have access to this organization." };
  }

  const { data: batch, error: batchError } = await supabase
    .from("batches")
    .insert(mapFormToBatchInsert(values, organizationId))
    .select("id")
    .single();

  if (batchError) {
    return { error: batchError.message };
  }

  const ingredientRows = mapFormToBatchIngredientInserts(
    Number(batch.id),
    values.ingredients,
  );
  const { error: ingredientsError } = await supabase
    .from("batch_ingredients")
    .insert(ingredientRows);

  if (ingredientsError) {
    await supabase.from("batches").delete().eq("id", batch.id);
    return { error: ingredientsError.message };
  }

  revalidatePath("/batches");
  revalidatePath("/recipes");
  return { data: { batchId: String(batch.id) } };
}

export async function deleteBatches(
  organizationId: string,
  batchIds: string[],
): Promise<ActionError | ActionSuccess<{ deletedIds: string[] }>> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured. Check your environment variables." };
  }

  if (!organizationId || batchIds.length === 0) {
    return { data: { deletedIds: [] } };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to delete batches." };
  }

  const numericIds = batchIds.map((id) => Number(id)).filter((id) => Number.isFinite(id));

  const { data, error } = await supabase
    .from("batches")
    .delete()
    .eq("organization_id", organizationId)
    .in("id", numericIds)
    .select("id");

  if (error) {
    if (error.code === "23503") {
      return {
        error: "A selected batch is used by a recipe, so it can't be deleted yet.",
      };
    }
    return { error: error.message };
  }

  const deletedIds = (data ?? []).map((row) => String(row.id));
  if (deletedIds.length === 0) {
    return { error: "No batches were deleted." };
  }

  revalidatePath("/batches");
  revalidatePath("/recipes");
  return { data: { deletedIds } };
}
