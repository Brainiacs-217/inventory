import { getSql } from "@/lib/sql/client";
import { createClient } from "@/lib/supabase/server";
import type { RecipeSales, RecipeSalesByPeriod, SalesPeriod } from "@/types/dashboard";

export type ProductProfitRow = {
  product_name: string;
  quantity_sold: string;
  revenue: string | null;
  current_recipe_cost: string | null;
  estimated_cogs: string | null;
  estimated_gross_profit: string | null;
};

export type GrossProfitRow = {
  total_revenue: string;
  total_cogs: string | null;
  gross_profit: string | null;
  gross_margin_percent: string | null;
  missing_cost_lines: string;
};

/** Estimated profit from the current recipe cost for each sold product in [from, to). */
export function listProductProfit(organizationId: string, from: Date, to: Date) {
  return getSql()<ProductProfitRow[]>`
    select
      si.name as product_name,
      sum(ss.quantity) as quantity_sold,
      sum(ss.revenue_cents) / 100.0 as revenue,
      max(rc.cost_per_recipe) as current_recipe_cost,
      sum(ss.quantity * rc.cost_per_recipe) as estimated_cogs,
      (
        sum(ss.revenue_cents) / 100.0
        - sum(ss.quantity * rc.cost_per_recipe)
      ) as estimated_gross_profit
    from square_sales as ss
    join square_items as si
      on si.id = ss.square_item_id
      and si.organization_id = ss.organization_id
    join recipe_costs as rc
      on rc.recipe_id = si.recipe_id
      and rc.organization_id = ss.organization_id
    where ss.organization_id = ${organizationId}
      and ss.sold_at >= ${from}
      and ss.sold_at < ${to}
      and rc.cost_per_recipe is not null
    group by si.id, si.name
    order by estimated_gross_profit desc
  `;
}

const SALES_PERIODS = ["day", "week", "month", "year"] as const;

const EMPTY_TOP_ITEMS: RecipeSalesByPeriod = {
  day: [],
  week: [],
  month: [],
  year: [],
};

type TopItemRow = {
  id: string | number;
  name: string;
  quantity_sold: string | number;
  sales: string | number | null;
  profit: string | number | null;
};

function asNumber(value: string | number | null): number | null {
  if (value == null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function periodStep(unit: SalesPeriod) {
  const sql = getSql();
  if (unit === "day") return sql`interval '1 day'`;
  if (unit === "week") return sql`interval '1 week'`;
  if (unit === "month") return sql`interval '1 month'`;
  return sql`interval '1 year'`;
}

async function locationTimezone(organizationId: string): Promise<string> {
  const rows = await getSql()<{ timezone: string | null }[]>`
    select timezone
    from square_locations
    where organization_id = ${organizationId}
      and timezone is not null
      and timezone <> ''
    limit 1
  `;
  return rows[0]?.timezone || "America/Los_Angeles";
}

async function listTopItems(
  organizationId: string,
  timezone: string,
  unit: SalesPeriod,
): Promise<RecipeSales[]> {
  const rows = await getSql()<TopItemRow[]>`
    with bounds as (
      select
        timezone(${timezone}, date_trunc(${unit}, timezone(${timezone}, now()))) as period_start,
        timezone(
          ${timezone},
          date_trunc(${unit}, timezone(${timezone}, now())) + ${periodStep(unit)}
        ) as period_end
    )
    select
      si.id,
      si.name,
      sum(ss.quantity) as quantity_sold,
      sum(ss.revenue_cents) / 100.0 as sales,
      case
        when bool_and(rc.cost_per_recipe is not null) then
          sum(ss.revenue_cents) / 100.0 - sum(ss.quantity * rc.cost_per_recipe)
        else null
      end as profit
    from square_sales as ss
    join square_items as si
      on si.id = ss.square_item_id
      and si.organization_id = ss.organization_id
    left join recipe_costs as rc
      on rc.recipe_id = si.recipe_id
      and rc.organization_id = ss.organization_id
    cross join bounds
    where ss.organization_id = ${organizationId}
      and ss.sold_at >= bounds.period_start
      and ss.sold_at < bounds.period_end
    group by si.id, si.name
    order by sales desc nulls last, quantity_sold desc
    limit 5
  `;

  return rows.map((row) => ({
    id: String(row.id),
    name: row.name,
    sales: asNumber(row.sales) ?? 0,
    profit: asNumber(row.profit),
    quantitySold: asNumber(row.quantity_sold) ?? 0,
  }));
}

/** Top five sold Square items for the current day, week, month, and year. */
export async function listTopItemSales(
  organizationId: string,
): Promise<RecipeSalesByPeriod> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !organizationId || !process.env.DATABASE_URL) return EMPTY_TOP_ITEMS;

  const { data: member } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("profile_id", user.id)
    .maybeSingle();
  if (!member) return EMPTY_TOP_ITEMS;

  const timezone = await locationTimezone(organizationId);
  const entries = await Promise.all(
    SALES_PERIODS.map(async (period) => {
      const items = await listTopItems(organizationId, timezone, period);
      return [period, items] as const;
    }),
  );

  return {
    ...EMPTY_TOP_ITEMS,
    ...Object.fromEntries(entries),
  };
}

/** Historical revenue, ingredient cost, and margin for [from, to). Amounts are dollars. */
export function summarizeGrossProfit(organizationId: string, from: Date, to: Date) {
  return getSql()<GrossProfitRow[]>`
    select
      coalesce(sum(revenue_cents), 0) / 100.0 as total_revenue,
      sum(ingredient_cost_cents) / 100.0 as total_cogs,
      (
        sum(revenue_cents) - sum(ingredient_cost_cents)
      ) / 100.0 as gross_profit,
      case
        when sum(revenue_cents) > 0
        then (
          sum(revenue_cents) - sum(ingredient_cost_cents)
        ) * 100.0 / sum(revenue_cents)
        else null
      end as gross_margin_percent,
      count(*) filter (
        where ingredient_cost_cents is null
      ) as missing_cost_lines
    from square_sales
    where organization_id = ${organizationId}
      and sold_at >= ${from}
      and sold_at < ${to}
  `;
}
