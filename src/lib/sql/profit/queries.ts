import { getSql } from "@/lib/sql/client";

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
