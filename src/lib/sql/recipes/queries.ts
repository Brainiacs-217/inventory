import { getSql } from "@/lib/sql/client";
import { createClient } from "@/lib/supabase/server";

export type RecipeCostRow = {
  recipe_id: string;
  organization_id: string;
  recipe_name: string;
  cost_per_recipe: string | null;
};

function asText(value: number | string | null): string | null {
  return value == null ? null : String(value);
}

export async function listRecipeCosts(organizationId: string): Promise<RecipeCostRow[]> {
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

    return getSql()<RecipeCostRow[]>`
      select
        recipe_id,
        organization_id,
        recipe_name,
        cost_per_recipe
      from recipe_costs
      where organization_id = ${organizationId}
      order by recipe_name
    `;
  }

  const { data, error } = await supabase
    .from("recipe_costs")
    .select("recipe_id, organization_id, recipe_name, cost_per_recipe")
    .eq("organization_id", organizationId)
    .order("recipe_name");

  if (error) {
    console.error("Failed to load recipe costs:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    recipe_id: String(row.recipe_id),
    organization_id: row.organization_id,
    recipe_name: row.recipe_name,
    cost_per_recipe: asText(row.cost_per_recipe),
  }));
}
