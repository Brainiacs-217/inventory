-- Square OAuth connections (one per organization)
create table public.square_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  merchant_id text not null,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id)
);

create index square_connections_organization_id_idx
  on public.square_connections (organization_id);

alter table public.square_connections enable row level security;

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
