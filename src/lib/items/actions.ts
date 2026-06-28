"use server";

import { revalidatePath } from "next/cache";

import { mapFormToItemInsert, mapItemRowToInventoryItem } from "@/lib/items/mappers";
import { getOrganizationItems } from "@/lib/items/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { CreateItemFormValues, InventoryItem } from "@/types/item";
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

export async function createItem(
  organizationId: string,
  values: CreateItemFormValues,
): Promise<ActionError | ActionSuccess<{ item: InventoryItem }>> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured. Check your environment variables." };
  }

  if (!organizationId) {
    return { error: "Select an organization before adding items." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to create an item." };
  }

  const isMember = await verifyOrgMembership(supabase, organizationId, user.id);
  if (!isMember) {
    return { error: "You do not have access to this organization." };
  }

  const insert = mapFormToItemInsert(values, organizationId);

  const { data, error } = await supabase.from("items").insert(insert).select().single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/items");
  return { data: { item: mapItemRowToInventoryItem(data as Tables<"items">) } };
}

export async function fetchOrganizationItems(
  organizationId: string,
): Promise<ActionError | ActionSuccess<{ items: InventoryItem[] }>> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured. Check your environment variables." };
  }

  if (!organizationId) {
    return { data: { items: [] } };
  }

  try {
    const items = await getOrganizationItems(organizationId);
    return { data: { items } };
  } catch {
    return { error: "Failed to load items." };
  }
}

export async function deleteItems(
  organizationId: string,
  itemIds: string[],
): Promise<ActionError | ActionSuccess<{ deletedIds: string[] }>> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured. Check your environment variables." };
  }

  if (!organizationId) {
    return { error: "Select an organization before deleting items." };
  }

  if (itemIds.length === 0) {
    return { data: { deletedIds: [] } };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to delete items." };
  }

  const isMember = await verifyOrgMembership(supabase, organizationId, user.id);
  if (!isMember) {
    return { error: "You do not have access to this organization." };
  }

  const { data, error } = await supabase
    .from("items")
    .delete()
    .eq("organization_id", organizationId)
    .in("id", itemIds)
    .select("id");

  if (error) {
    return { error: error.message };
  }

  const deletedIds = (data ?? []).map((row) => row.id);
  if (deletedIds.length === 0) {
    return { error: "No items were deleted. Try again or refresh the page." };
  }

  revalidatePath("/items");
  return { data: { deletedIds } };
}
