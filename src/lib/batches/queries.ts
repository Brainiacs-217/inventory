import { mapBatchRowToBatch } from "@/lib/batches/mappers";
import { listBatchCosts } from "@/lib/sql/batch/queries";
import { createClient } from "@/lib/supabase/server";
import type { Batch } from "@/types/batch";
import type { Tables } from "@/types/database";
import type { BatchOption } from "@/types/recipe";

function parseCost(value: number | string | null | undefined): number | null {
  if (value == null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function loadBatchTotalCosts(
  organizationId: string,
): Promise<Map<string, number | null>> {
  const rows = await listBatchCosts(organizationId);
  return new Map(rows.map((row) => [row.batch_id, parseCost(row.total_batch_cost)]));
}

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

  const [{ data, error }, { data: units, error: unitsError }, costs] = await Promise.all([
    supabase
      .from("batches")
      .select(
        "id, name, created_at, yield_quantity, yield_unit_id, batch_ingredients(id, item_id, quantity, unit_id)",
      )
      .eq("organization_id", organizationId)
      .order("name"),
    supabase.from("units").select("id, symbol"),
    loadBatchTotalCosts(organizationId),
  ]);

  if (error) {
    console.error("Failed to load organization batches:", error.message);
    return [];
  }

  if (unitsError) {
    console.error("Failed to load units for batches:", unitsError.message);
  }

  const symbols = new Map((units ?? []).map((unit) => [unit.id, unit.symbol]));

  return (data ?? []).map((row) => {
    const batch = mapBatchRowToBatch(
      row as Tables<"batches"> & {
        batch_ingredients: {
          id: number;
          item_id: number;
          quantity: number;
          unit_id: number;
        }[] | null;
      },
      symbols.get(row.yield_unit_id) ?? "",
    );
    return { ...batch, totalCost: costs.get(batch.id) ?? null };
  });
}
