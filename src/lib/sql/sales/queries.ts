import { getSql } from "@/lib/sql/client";

export type SaleRow = {
  square_item_id: string;
  name: string;
  quantity_sold: string;
  total_revenue: string | null;
};

/** Units sold and net revenue, in dollars, for each Square item in [from, to). */
export function listSales(organizationId: string, from: Date, to: Date) {
  return getSql()<SaleRow[]>`
    select
      si.id as square_item_id,
      si.name,
      sum(ss.quantity) as quantity_sold,
      sum(ss.revenue_cents) / 100.0 as total_revenue
    from square_sales as ss
    join square_items as si
      on si.id = ss.square_item_id
      and si.organization_id = ss.organization_id
    where ss.organization_id = ${organizationId}
      and ss.sold_at >= ${from}
      and ss.sold_at < ${to}
    group by si.id, si.name
    order by quantity_sold desc
  `;
}
