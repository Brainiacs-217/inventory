-- Helper to check org membership without RLS recursion.
create or replace function public.is_org_member(org_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.organization_members
    where organization_id = org_id
      and profile_id = auth.uid()
  );
$$;

revoke all on function public.is_org_member(uuid) from public;
grant execute on function public.is_org_member(uuid) to authenticated;

-- items RLS
create policy "Members can view org items"
  on public.items
  for select
  to authenticated
  using (public.is_org_member(organization_id));

create policy "Members can create org items"
  on public.items
  for insert
  to authenticated
  with check (public.is_org_member(organization_id));

create policy "Members can update org items"
  on public.items
  for update
  to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

create policy "Members can delete org items"
  on public.items
  for delete
  to authenticated
  using (public.is_org_member(organization_id));
