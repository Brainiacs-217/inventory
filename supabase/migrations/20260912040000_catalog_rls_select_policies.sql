-- Lookup tables are global and needed for nested item reads.
drop policy if exists "Authenticated can view item types" on public.item_types;
create policy "Authenticated can view item types"
  on public.item_types for select to authenticated
  using (true);

drop policy if exists "Authenticated can view categories" on public.categories;
create policy "Authenticated can view categories"
  on public.categories for select to authenticated
  using (true);

drop policy if exists "Authenticated can view subcategories" on public.subcategories;
create policy "Authenticated can view subcategories"
  on public.subcategories for select to authenticated
  using (true);

drop policy if exists "Authenticated can view vendors" on public.vendors;
create policy "Authenticated can view vendors"
  on public.vendors for select to authenticated
  using (true);

drop policy if exists "Authenticated can view units" on public.units;
create policy "Authenticated can view units"
  on public.units for select to authenticated
  using (true);

-- items may have been rebuilt without the original org-member policies.
drop policy if exists "Members can view org items" on public.items;
drop policy if exists "Members can create org items" on public.items;
drop policy if exists "Members can update org items" on public.items;
drop policy if exists "Members can delete org items" on public.items;

create policy "Members can view org items"
  on public.items for select to authenticated
  using (public.is_org_member(organization_id));

create policy "Members can create org items"
  on public.items for insert to authenticated
  with check (public.is_org_member(organization_id));

create policy "Members can update org items"
  on public.items for update to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

create policy "Members can delete org items"
  on public.items for delete to authenticated
  using (public.is_org_member(organization_id));

drop policy if exists "Members can view org item packages" on public.item_packages;
drop policy if exists "Members can create org item packages" on public.item_packages;
drop policy if exists "Members can update org item packages" on public.item_packages;
drop policy if exists "Members can delete org item packages" on public.item_packages;

create policy "Members can view org item packages"
  on public.item_packages for select to authenticated
  using (
    exists (
      select 1
      from public.items i
      where i.id = item_packages.item_id
        and public.is_org_member(i.organization_id)
    )
  );

create policy "Members can create org item packages"
  on public.item_packages for insert to authenticated
  with check (
    exists (
      select 1
      from public.items i
      where i.id = item_packages.item_id
        and public.is_org_member(i.organization_id)
    )
  );

create policy "Members can update org item packages"
  on public.item_packages for update to authenticated
  using (
    exists (
      select 1
      from public.items i
      where i.id = item_packages.item_id
        and public.is_org_member(i.organization_id)
    )
  )
  with check (
    exists (
      select 1
      from public.items i
      where i.id = item_packages.item_id
        and public.is_org_member(i.organization_id)
    )
  );

create policy "Members can delete org item packages"
  on public.item_packages for delete to authenticated
  using (
    exists (
      select 1
      from public.items i
      where i.id = item_packages.item_id
        and public.is_org_member(i.organization_id)
    )
  );
