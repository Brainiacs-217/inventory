-- Fix infinite recursion: organization_members SELECT must not subquery itself.
drop policy if exists "Members can view organization memberships" on public.organization_members;

create policy "Members can view their own memberships"
  on public.organization_members
  for select
  to authenticated
  using (profile_id = auth.uid());
