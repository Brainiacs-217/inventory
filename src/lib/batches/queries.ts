import { createClient } from "@/lib/supabase/server";
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
