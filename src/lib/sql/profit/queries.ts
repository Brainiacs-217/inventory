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

const EMPTY_RECIPE_PROFIT: RecipeSalesByPeriod = {
  day: [],
  week: [],
  month: [],
  year: [],
};

function asNumber(value: string | number | null): number | null {
  if (value == null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

type RecipeProfitRow = {
  recipe_id: string | number;
  recipe_name: string;
} & Record<`${SalesPeriod}_${"revenue" | "profit" | "quantity"}`, string | number | null>;

function recipesForPeriod(rows: RecipeProfitRow[], period: SalesPeriod): RecipeSales[] {
  return rows
    .map((row) => ({
      id: String(row.recipe_id),
      name: row.recipe_name,
      revenue: asNumber(row[`${period}_revenue`]) ?? 0,
      profit: asNumber(row[`${period}_profit`]) ?? 0,
      quantitySold: asNumber(row[`${period}_quantity`]) ?? 0,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Revenue and profit for every recipe in the current day, week, month, and year.
 * Same recipe_costs formula as listProductProfit.
 */
export async function listTopItemSales(
  organizationId: string,
): Promise<RecipeSalesByPeriod> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !organizationId || !process.env.DATABASE_URL) return EMPTY_RECIPE_PROFIT;

  const { data: member } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("profile_id", user.id)
    .maybeSingle();
  if (!member) return EMPTY_RECIPE_PROFIT;

  const rows = await getSql()<RecipeProfitRow[]>`
    with location as (
      select coalesce(
        (
          select timezone
          from square_locations
          where organization_id = ${organizationId}
            and timezone is not null
            and timezone <> ''
          limit 1
        ),
        'America/Los_Angeles'
      ) as tz
    ),
    bounds as (
      select
        timezone(tz, date_trunc('day', timezone(tz, now()))) as day_start,
        timezone(tz, date_trunc('day', timezone(tz, now())) + interval '1 day') as day_end,
        timezone(tz, date_trunc('week', timezone(tz, now()))) as week_start,
        timezone(tz, date_trunc('week', timezone(tz, now())) + interval '1 week') as week_end,
        timezone(tz, date_trunc('month', timezone(tz, now()))) as month_start,
        timezone(tz, date_trunc('month', timezone(tz, now())) + interval '1 month') as month_end,
        timezone(tz, date_trunc('year', timezone(tz, now()))) as year_start,
        timezone(tz, date_trunc('year', timezone(tz, now())) + interval '1 year') as year_end
      from location
    ),
    sales as (
      select
        r.id as recipe_id,
        sum(ss.quantity) filter (where ss.sold_at >= b.day_start and ss.sold_at < b.day_end) as day_quantity,
        sum(ss.revenue_cents) filter (where ss.sold_at >= b.day_start and ss.sold_at < b.day_end) as day_revenue_cents,
        sum(ss.quantity) filter (where ss.sold_at >= b.week_start and ss.sold_at < b.week_end) as week_quantity,
        sum(ss.revenue_cents) filter (where ss.sold_at >= b.week_start and ss.sold_at < b.week_end) as week_revenue_cents,
        sum(ss.quantity) filter (where ss.sold_at >= b.month_start and ss.sold_at < b.month_end) as month_quantity,
        sum(ss.revenue_cents) filter (where ss.sold_at >= b.month_start and ss.sold_at < b.month_end) as month_revenue_cents,
        sum(ss.quantity) filter (where ss.sold_at >= b.year_start and ss.sold_at < b.year_end) as year_quantity,
        sum(ss.revenue_cents) filter (where ss.sold_at >= b.year_start and ss.sold_at < b.year_end) as year_revenue_cents
      from square_sales as ss
      join square_items as si
        on si.id = ss.square_item_id
        and si.organization_id = ss.organization_id
      join recipes as r
        on r.organization_id = si.organization_id
        and (
          r.id = si.recipe_id
          or (
            si.recipe_id is null
            and trim(regexp_replace(regexp_replace(lower(si.name), '[^a-z0-9]+', ' ', 'g'), '^(bd|fb) ', ''))
              = trim(regexp_replace(regexp_replace(lower(r.name), '[^a-z0-9]+', ' ', 'g'), '^(bd|fb) ', ''))
          )
        )
      cross join bounds as b
      where ss.organization_id = ${organizationId}
        and ss.sold_at >= least(b.day_start, b.week_start, b.month_start, b.year_start)
        and ss.sold_at < greatest(b.day_end, b.week_end, b.month_end, b.year_end)
      group by r.id
    )
    select
      rc.recipe_id,
      rc.recipe_name,
      coalesce(s.day_revenue_cents, 0) / 100.0 as day_revenue,
      coalesce(s.day_revenue_cents, 0) / 100.0
        - coalesce(s.day_quantity, 0) * rc.cost_per_recipe as day_profit,
      coalesce(s.day_quantity, 0) as day_quantity,
      coalesce(s.week_revenue_cents, 0) / 100.0 as week_revenue,
      coalesce(s.week_revenue_cents, 0) / 100.0
        - coalesce(s.week_quantity, 0) * rc.cost_per_recipe as week_profit,
      coalesce(s.week_quantity, 0) as week_quantity,
      coalesce(s.month_revenue_cents, 0) / 100.0 as month_revenue,
      coalesce(s.month_revenue_cents, 0) / 100.0
        - coalesce(s.month_quantity, 0) * rc.cost_per_recipe as month_profit,
      coalesce(s.month_quantity, 0) as month_quantity,
      coalesce(s.year_revenue_cents, 0) / 100.0 as year_revenue,
      coalesce(s.year_revenue_cents, 0) / 100.0
        - coalesce(s.year_quantity, 0) * rc.cost_per_recipe as year_profit,
      coalesce(s.year_quantity, 0) as year_quantity
    from recipe_costs as rc
    left join sales as s
      on s.recipe_id = rc.recipe_id
    where rc.organization_id = ${organizationId}
      and rc.cost_per_recipe is not null
  `;

  return {
    day: recipesForPeriod(rows, "day"),
    week: recipesForPeriod(rows, "week"),
    month: recipesForPeriod(rows, "month"),
    year: recipesForPeriod(rows, "year"),
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
