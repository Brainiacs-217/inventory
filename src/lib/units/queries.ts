import { createClient } from "@/lib/supabase/server";
import type { UnitOption } from "@/types/recipe";

export async function getUnits(): Promise<UnitOption[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("units")
    .select("id, name, symbol, measurement_type")
    .order("name");

  if (error) {
    console.error("Failed to load units:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: String(row.id),
    name: row.name,
    symbol: row.symbol,
    measurementType: row.measurement_type,
  }));
}
