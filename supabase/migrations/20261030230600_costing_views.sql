-- Costing views. security_invoker so the querying role's row level security applies.
-- A direct database connection still bypasses row level security.

drop view if exists public.recipe_costs;
drop view if exists public.batch_costs;
drop view if exists public.ingredient_unit_costs;

create view public.ingredient_unit_costs
with (security_invoker = true) as
select distinct on (ip.item_id)
    ip.item_id,
    i.organization_id,
    ip.id as package_id,
    ip.purchase_price / nullif(
        ip.units_per_package * ip.unit_size * u.conversion_to_standard,
        0
    ) as cost_per_standard_unit,
    u.measurement_type
from public.item_packages as ip
join public.items as i on i.id = ip.item_id
join public.units as u on u.id = ip.unit_id
where ip.purchase_price is not null
  and ip.purchase_price >= 0
  and ip.units_per_package > 0
  and ip.unit_size > 0
  and u.conversion_to_standard > 0
order by ip.item_id, cost_per_standard_unit asc, ip.id;

create view public.batch_costs
with (security_invoker = true) as
select
    b.id as batch_id,
    b.organization_id,
    b.name,
    b.yield_quantity,
    b.yield_unit_id,
    sum(
        bi.quantity
        * u.conversion_to_standard
        * ic.cost_per_standard_unit
    ) as total_batch_cost,
    sum(
        bi.quantity
        * u.conversion_to_standard
        * ic.cost_per_standard_unit
    ) / nullif(
        b.yield_quantity * yu.conversion_to_standard,
        0
    ) as cost_per_standard_unit,
    yu.measurement_type
from public.batches as b
join public.batch_ingredients as bi on bi.batch_id = b.id
join public.items as i
    on i.id = bi.item_id
   and i.organization_id = b.organization_id
join public.units as u on u.id = bi.unit_id
join public.ingredient_unit_costs as ic
    on ic.item_id = bi.item_id
   and ic.organization_id = b.organization_id
join public.units as yu on yu.id = b.yield_unit_id
where u.measurement_type = ic.measurement_type
group by
    b.id, b.organization_id, b.name,
    b.yield_quantity, b.yield_unit_id,
    yu.conversion_to_standard, yu.measurement_type;

create view public.recipe_costs
with (security_invoker = true) as
select
    r.id as recipe_id,
    r.organization_id,
    r.name as recipe_name,
    sum(
        case
            when ri.batch_id is not null then
                ri.quantity
                * u.conversion_to_standard
                * bc.cost_per_standard_unit
            when ri.item_id is not null then
                ri.quantity
                * u.conversion_to_standard
                * ic.cost_per_standard_unit
            else null
        end
    ) as cost_per_recipe
from public.recipes as r
join public.recipe_ingredients as ri on ri.recipe_id = r.id
join public.units as u on u.id = ri.unit_id
left join public.items as i
    on i.id = ri.item_id
   and i.organization_id = r.organization_id
left join public.ingredient_unit_costs as ic
    on ic.item_id = i.id
   and ic.organization_id = r.organization_id
   and ic.measurement_type = u.measurement_type
left join public.batch_costs as bc
    on bc.batch_id = ri.batch_id
   and bc.organization_id = r.organization_id
   and bc.measurement_type = u.measurement_type
group by r.id, r.organization_id, r.name;

revoke all on table public.ingredient_unit_costs from anon, public;
revoke all on table public.batch_costs from anon, public;
revoke all on table public.recipe_costs from anon, public;

grant select on table public.ingredient_unit_costs to authenticated, service_role;
grant select on table public.batch_costs to authenticated, service_role;
grant select on table public.recipe_costs to authenticated, service_role;
