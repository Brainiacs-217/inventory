import { getSql } from "@/lib/sql/client";
import { createClient } from "@/lib/supabase/server";
import type { LinkedSquareItem, SquareItemMatch } from "@/types/recipe";

type LinkedSquareItemRow = {
  id: string | number;
  name: string;
  recipe_id: string | number;
};

type SquareItemMatchRow = {
  id: string | number;
  name: string;
  recipe_id: string | number | null;
  recipe_name: string | null;
};

function asId(value: string | number): string {
  return String(value);
}

async function canReadOrganization(organizationId: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !process.env.DATABASE_URL) return false;

  const { data: member } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("profile_id", user.id)
    .maybeSingle();

  return member != null;
}

function likePattern(query: string): string {
  const escaped = query.replace(/[%_\\]/g, "\\$&");
  return `%${escaped}%`;
}

export async function listLinkedSquareItems(
  organizationId: string,
): Promise<(LinkedSquareItem & { recipeId: string })[]> {
  if (!(await canReadOrganization(organizationId))) return [];

  const rows = await getSql()<LinkedSquareItemRow[]>`
    select id, name, recipe_id
    from square_items
    where organization_id = ${organizationId}
      and recipe_id is not null
    order by name
  `;

  return rows.map((row) => ({
    id: asId(row.id),
    name: row.name,
    recipeId: asId(row.recipe_id),
  }));
}

export async function searchSquareItemMatches(
  organizationId: string,
  query: string,
): Promise<SquareItemMatch[]> {
  const term = query.trim();
  if (term.length < 2 || !(await canReadOrganization(organizationId))) return [];

  const rows = await getSql()<SquareItemMatchRow[]>`
    select
      si.id,
      si.name,
      si.recipe_id,
      r.name as recipe_name
    from square_items as si
    left join recipes as r
      on r.id = si.recipe_id
      and r.organization_id = si.organization_id
    where si.organization_id = ${organizationId}
      and si.name ilike ${likePattern(term)}
    order by si.name
    limit 12
  `;

  return rows.map((row) => ({
    id: asId(row.id),
    name: row.name,
    recipeId: row.recipe_id == null ? null : asId(row.recipe_id),
    recipeName: row.recipe_name,
  }));
}

/** Caller must already have confirmed the user belongs to this organization. */
export async function setRecipeSquareItems(
  organizationId: string,
  recipeId: number,
  squareItemIds: string[],
): Promise<{ error: string } | { data: true }> {
  const ids = [
    ...new Set(
      squareItemIds
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0),
    ),
  ];

  const sql = getSql();
  const linked = await sql.begin(async (tx) => {
    if (ids.length === 0) {
      await tx`
        update square_items
        set recipe_id = null
        where organization_id = ${organizationId}
          and recipe_id = ${recipeId}
      `;
      return [];
    }

    await tx`
      update square_items
      set recipe_id = null
      where organization_id = ${organizationId}
        and recipe_id = ${recipeId}
        and id not in ${tx(ids)}
    `;

    return tx<{ id: string | number }[]>`
      update square_items
      set recipe_id = ${recipeId}
      where organization_id = ${organizationId}
        and id in ${tx(ids)}
      returning id
    `;
  });

  if (linked.length !== ids.length) {
    return { error: "One or more Square items could not be linked." };
  }

  return { data: true };
}
