create policy "Members can view org recipes"
  on public.recipes for select to authenticated
  using (public.is_org_member(organization_id));

create policy "Members can create org recipes"
  on public.recipes for insert to authenticated
  with check (public.is_org_member(organization_id));

create policy "Members can update org recipes"
  on public.recipes for update to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

create policy "Members can delete org recipes"
  on public.recipes for delete to authenticated
  using (public.is_org_member(organization_id));

create policy "Members can view recipe ingredients"
  on public.recipe_ingredients for select to authenticated
  using (
    exists (
      select 1
      from public.recipes
      where recipes.id = recipe_ingredients.recipe_id
        and public.is_org_member(recipes.organization_id)
    )
  );

create policy "Members can create recipe ingredients"
  on public.recipe_ingredients for insert to authenticated
  with check (
    exists (
      select 1
      from public.recipes
      where recipes.id = recipe_ingredients.recipe_id
        and public.is_org_member(recipes.organization_id)
    )
  );

create policy "Members can update recipe ingredients"
  on public.recipe_ingredients for update to authenticated
  using (
    exists (
      select 1
      from public.recipes
      where recipes.id = recipe_ingredients.recipe_id
        and public.is_org_member(recipes.organization_id)
    )
  )
  with check (
    exists (
      select 1
      from public.recipes
      where recipes.id = recipe_ingredients.recipe_id
        and public.is_org_member(recipes.organization_id)
    )
  );

create policy "Members can delete recipe ingredients"
  on public.recipe_ingredients for delete to authenticated
  using (
    exists (
      select 1
      from public.recipes
      where recipes.id = recipe_ingredients.recipe_id
        and public.is_org_member(recipes.organization_id)
    )
  );

create policy "Members can view org batches"
  on public.batches for select to authenticated
  using (public.is_org_member(organization_id));

create policy "Members can create org batches"
  on public.batches for insert to authenticated
  with check (public.is_org_member(organization_id));

create policy "Members can update org batches"
  on public.batches for update to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

create policy "Members can delete org batches"
  on public.batches for delete to authenticated
  using (public.is_org_member(organization_id));

create policy "Members can view batch ingredients"
  on public.batch_ingredients for select to authenticated
  using (
    exists (
      select 1
      from public.batches
      where batches.id = batch_ingredients.batch_id
        and public.is_org_member(batches.organization_id)
    )
  );

create policy "Members can create batch ingredients"
  on public.batch_ingredients for insert to authenticated
  with check (
    exists (
      select 1
      from public.batches
      where batches.id = batch_ingredients.batch_id
        and public.is_org_member(batches.organization_id)
    )
  );

create policy "Members can update batch ingredients"
  on public.batch_ingredients for update to authenticated
  using (
    exists (
      select 1
      from public.batches
      where batches.id = batch_ingredients.batch_id
        and public.is_org_member(batches.organization_id)
    )
  )
  with check (
    exists (
      select 1
      from public.batches
      where batches.id = batch_ingredients.batch_id
        and public.is_org_member(batches.organization_id)
    )
  );

create policy "Members can delete batch ingredients"
  on public.batch_ingredients for delete to authenticated
  using (
    exists (
      select 1
      from public.batches
      where batches.id = batch_ingredients.batch_id
        and public.is_org_member(batches.organization_id)
    )
  );
