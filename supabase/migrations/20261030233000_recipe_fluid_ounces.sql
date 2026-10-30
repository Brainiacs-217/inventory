-- Cocktail lines were saved on the weight ounce, so they did not match volume prices.
-- Fluid ounce is the unit those recipe costs expect.

update public.recipe_ingredients as ri
set unit_id = 3
where ri.unit_id = 7
  and ri.id in (
    select ri2.id
    from public.recipe_ingredients as ri2
    join public.recipes as r on r.id = ri2.recipe_id
    left join public.items as i
      on i.id = ri2.item_id
     and i.organization_id = r.organization_id
    left join public.ingredient_unit_costs as ic
      on ic.item_id = i.id
     and ic.organization_id = r.organization_id
    left join public.batch_costs as bc
      on bc.batch_id = ri2.batch_id
     and bc.organization_id = r.organization_id
    where ri2.unit_id = 7
      and (ic.measurement_type = 'volume' or bc.measurement_type = 'volume')
  );
