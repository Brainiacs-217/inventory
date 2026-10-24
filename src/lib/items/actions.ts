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

type SubcategoryLookup = {
  id: number;
  category: {
    item_type: { name: string } | null;
  } | null;
};

export async function updateItem(
  organizationId: string,
  itemId: string,
  values: CreateItemFormValues,
): Promise<ActionError | ActionSuccess<{ itemId: string }>> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured. Check your environment variables." };
  }

  if (!organizationId) {
    return { error: "Select an organization before editing items." };
  }

  const name = values.name.trim();
  const subcategoryName = values.subcategory.trim();
  const unitSymbol = values.baseUnit.trim();
  const caseSize = Number(values.caseSize);
  const unitSize = Number(values.unitSize);
  const price = Number(values.price);

  if (!name) return { error: "Name is required." };
  if (!subcategoryName) return { error: "Sub category is required." };
  if (!unitSymbol) return { error: "Base unit is required." };
  if (!Number.isInteger(caseSize) || caseSize <= 0) {
    return { error: "Case size must be a whole number greater than 0." };
  }
  if (!Number.isFinite(unitSize) || unitSize <= 0) {
    return { error: "Unit size must be greater than 0." };
  }
  if (!Number.isFinite(price) || price < 0) {
    return { error: "Price must be a valid number." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to edit an item." };
  }

  const isMember = await verifyOrgMembership(supabase, organizationId, user.id);
  if (!isMember) {
    return { error: "You do not have access to this organization." };
  }

  const { data: existing, error: existingError } = await supabase
    .from("items")
    .select("id")
    .eq("id", itemId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (existingError) return { error: existingError.message };
  if (!existing) return { error: "Item was not found." };

  const { data: subcategoryRows, error: subcategoryError } = await supabase
    .from("subcategories" as "items")
    .select("id, category:categories(item_type:item_types(name))")
    .eq("name", subcategoryName);

  if (subcategoryError) return { error: subcategoryError.message };

  const subcategory = ((subcategoryRows ?? []) as unknown as SubcategoryLookup[]).find(
    (row) => row.category?.item_type?.name === values.category,
  );
  if (!subcategory) {
    return { error: "That sub category isn't available for this item." };
  }

  const { data: unit, error: unitError } = await supabase
    .from("units")
    .select("id, measurement_type")
    .eq("symbol", unitSymbol)
    .maybeSingle();

  if (unitError) return { error: unitError.message };
  if (!unit) return { error: "That unit isn't available." };

  const vendorName = values.vendor.trim();
  let vendorId: number | null = null;
  if (vendorName) {
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors" as "items")
      .select("id")
      .eq("name", vendorName)
      .maybeSingle();

    if (vendorError) return { error: vendorError.message };
    if (!vendor) return { error: "That vendor isn't available." };
    vendorId = Number(vendor.id);
  }

  const { error: itemError } = await supabase
    .from("items")
    .update({
      name,
      subcategory_id: subcategory.id,
      measurement_type: unit.measurement_type,
    } as never)
    .eq("id", itemId)
    .eq("organization_id", organizationId);

  if (itemError) return { error: itemError.message };

  const packageValues = {
    units_per_package: caseSize,
    unit_size: unitSize,
    unit_id: unit.id,
    vendor_id: vendorId,
    sku: values.sku.trim() || null,
    purchase_price: price,
  };

  const { data: packages, error: packagesError } = await supabase
    .from("item_packages" as "items")
    .select("id")
    .eq("item_id" as never, itemId as never)
    .order("id", { ascending: true })
    .limit(1);

  if (packagesError) return { error: packagesError.message };

  const packageId = packages?.[0]?.id;
  if (packageId) {
    const { error: packageError } = await supabase
      .from("item_packages" as "items")
      .update(packageValues as never)
      .eq("id", packageId);

    if (packageError) return { error: packageError.message };
  } else {
    const { error: packageError } = await supabase
      .from("item_packages" as "items")
      .insert({
        item_id: Number(itemId),
        package_type: "bottle",
        ...packageValues,
      } as never);

    if (packageError) return { error: packageError.message };
  }

  revalidatePath("/items");
  return { data: { itemId } };
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
