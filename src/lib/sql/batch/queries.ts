import { getSql } from "@/lib/sql/client";
import { createClient } from "@/lib/supabase/server";

export type BatchCostRow = {
  batch_id: string;
  name: string;
  yield_quantity: string;
  yield_unit_id: string;
  total_batch_cost: string | null;
  cost_per_standard_unit: string | null;
  measurement_type: string;
};

function asText(value: number | string | null): string | null {
  return value == null ? null : String(value);
}

export async function listBatchCosts(organizationId: string): Promise<BatchCostRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  if (process.env.DATABASE_URL) {
    const { data: member } = await supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("profile_id", user.id)
      .maybeSingle();
    if (!member) return [];

    return getSql()<BatchCostRow[]>`
      select
        batch_id,
        name,
        yield_quantity,
        yield_unit_id,
        total_batch_cost,
        cost_per_standard_unit,
        measurement_type
      from batch_costs
      where organization_id = ${organizationId}
      order by name
    `;
  }

  const { data, error } = await supabase
    .from("batch_costs")
    .select(
      "batch_id, name, yield_quantity, yield_unit_id, total_batch_cost, cost_per_standard_unit, measurement_type",
    )
    .eq("organization_id", organizationId)
    .order("name");

  if (error) {
    console.error("Failed to load batch costs:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    batch_id: String(row.batch_id),
    name: row.name,
    yield_quantity: String(row.yield_quantity),
    yield_unit_id: String(row.yield_unit_id),
    total_batch_cost: asText(row.total_batch_cost),
    cost_per_standard_unit: asText(row.cost_per_standard_unit),
    measurement_type: row.measurement_type,
  }));
}
