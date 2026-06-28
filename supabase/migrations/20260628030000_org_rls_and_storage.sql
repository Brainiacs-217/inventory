-- organizations RLS
create policy "Members can view their organizations"
  on public.organizations
  for select
  to authenticated
  using (
    created_by = auth.uid()
    or id in (
      select organization_id
      from public.organization_members
      where profile_id = auth.uid()
    )
  );

create policy "Authenticated users can create organizations"
  on public.organizations
  for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "Owners can update their organizations"
  on public.organizations
  for update
  to authenticated
  using (
    id in (
      select organization_id
      from public.organization_members
      where profile_id = auth.uid()
        and role = 'owner'
    )
  )
  with check (
    id in (
      select organization_id
      from public.organization_members
      where profile_id = auth.uid()
        and role = 'owner'
    )
  );

-- organization_members RLS
create policy "Members can view their own memberships"
  on public.organization_members
  for select
  to authenticated
  using (profile_id = auth.uid());

create policy "Users can add themselves as members"
  on public.organization_members
  for insert
  to authenticated
  with check (profile_id = auth.uid());

-- org-logos storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'org-logos',
  'org-logos',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
);

create policy "Public read access for org logos"
  on storage.objects
  for select
  to public
  using (bucket_id = 'org-logos');

create policy "Owners can upload org logos"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'org-logos'
    and (storage.foldername(name))[1]::uuid in (
      select organization_id
      from public.organization_members
      where profile_id = auth.uid()
        and role = 'owner'
    )
  );

create policy "Owners can update org logos"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'org-logos'
    and (storage.foldername(name))[1]::uuid in (
      select organization_id
      from public.organization_members
      where profile_id = auth.uid()
        and role = 'owner'
    )
  );

create policy "Owners can delete org logos"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'org-logos'
    and (storage.foldername(name))[1]::uuid in (
      select organization_id
      from public.organization_members
      where profile_id = auth.uid()
        and role = 'owner'
    )
  );
