"use server";

import { revalidatePath } from "next/cache";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { CreateStorageRoomFormValues } from "@/types/storage";

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

function revalidateInventory() {
  revalidatePath("/inventory");
}

export async function createStorageRoom(
  organizationId: string,
  values: CreateStorageRoomFormValues,
): Promise<ActionError | ActionSuccess<{ roomId: string }>> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in." };
  if (!(await verifyOrgMembership(supabase, organizationId, user.id))) {
    return { error: "You do not have access to this organization." };
  }

  const { data, error } = await supabase
    .from("storage_rooms")
    .insert({
      organization_id: organizationId,
      name: values.name.trim(),
      description: values.description.trim() || null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidateInventory();
  return { data: { roomId: data.id } };
}

export async function updateStorageRoom(
  organizationId: string,
  roomId: string,
  values: CreateStorageRoomFormValues,
): Promise<ActionError | Record<string, never>> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase
    .from("storage_rooms")
    .update({
      name: values.name.trim(),
      description: values.description.trim() || null,
    })
    .eq("id", roomId)
    .eq("organization_id", organizationId);

  if (error) return { error: error.message };

  revalidateInventory();
  return {};
}

export async function deleteStorageRoom(
  organizationId: string,
  roomId: string,
): Promise<ActionError | Record<string, never>> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("storage_rooms")
    .delete()
    .eq("id", roomId)
    .eq("organization_id", organizationId);

  if (error) return { error: error.message };

  revalidateInventory();
  return {};
}

export async function updateStorageRoomItems(
  organizationId: string,
  roomId: string,
  itemIds: string[],
): Promise<ActionError | Record<string, never>> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured." };
  }

  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from("storage_room_items")
    .delete()
    .eq("room_id", roomId);

  if (deleteError) return { error: deleteError.message };

  if (itemIds.length > 0) {
    const { error: insertError } = await supabase.from("storage_room_items").insert(
      itemIds.map((itemId) => ({ room_id: roomId, item_id: itemId })),
    );

    if (insertError) return { error: insertError.message };
  }

  revalidateInventory();
  return {};
}

export async function saveRoomCount(
  organizationId: string,
  entries: Array<{ itemId: string; countedQty: number }>,
): Promise<ActionError | Record<string, never>> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured." };
  }

  if (entries.length === 0) {
    return { error: "Enter at least one count before saving." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in." };

  const now = new Date().toISOString();
  for (const entry of entries) {
    const { error: updateError } = await supabase
      .from("items")
      .update({ on_hand: entry.countedQty, last_counted_at: now })
      .eq("id", entry.itemId)
      .eq("organization_id", organizationId);

    if (updateError) return { error: updateError.message };
  }

  revalidateInventory();
  return {};
}
