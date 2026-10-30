-- Let organization members save and read the Square OAuth connection.
-- Tokens stay in access_token_encrypted / refresh_token_encrypted.

revoke all on table public.square_connections from anon;

drop policy if exists "Members can view org square connection"
  on public.square_connections;
drop policy if exists "Members can create org square connection"
  on public.square_connections;
drop policy if exists "Members can update org square connection"
  on public.square_connections;
drop policy if exists "Members can delete org square connection"
  on public.square_connections;

create policy "Members can view org square connection"
  on public.square_connections for select to authenticated
  using (public.is_org_member(organization_id));

create policy "Members can create org square connection"
  on public.square_connections for insert to authenticated
  with check (public.is_org_member(organization_id));

create policy "Members can update org square connection"
  on public.square_connections for update to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

create policy "Members can delete org square connection"
  on public.square_connections for delete to authenticated
  using (public.is_org_member(organization_id));
