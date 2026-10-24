import { mapBatchRowToBatch } from "@/lib/batches/mappers";
import { createClient } from "@/lib/supabase/server";
import type { Batch } from "@/types/batch";
import type { Tables } from "@/types/database";
import type { BatchOption } from "@/types/recipe";

export async function getOrganizationBatches(
  organizationId: string,
): Promise<BatchOption[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("batches")
    .select("id, name")
    .eq("organization_id", organizationId)
    .order("name");

  if (error) {
    console.error("Failed to load organization batches:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: String(row.id),
    name: row.name,
  }));
}

export async function getOrganizationBatchList(
  organizationId: string,
): Promise<Batch[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const [{ data, error }, { data: units, error: unitsError }] = await Promise.all([
    supabase
      .from("batches")
      .select(
        "id, name, created_at, yield_quantity, yield_unit_id, batch_ingredients(id, item_id, quantity, unit_id)",
      )
      .eq("organization_id", organizationId)
      .order("name"),
    supabase.from("units").select("id, symbol"),
  ]);

  if (error) {
    console.error("Failed to load organization batches:", error.message);
    return [];
  }

  if (unitsError) {
    console.error("Failed to load units for batches:", unitsError.message);
  }

  const symbols = new Map((units ?? []).map((unit) => [unit.id, unit.symbol]));

  return (data ?? []).map((row) =>
    mapBatchRowToBatch(
      row as Tables<"batches"> & {
        batch_ingredients: {
          id: number;
          item_id: number;
          quantity: number;
          unit_id: number;
        }[] | null;
      },
      symbols.get(row.yield_unit_id) ?? "",
    ),
  );
}
