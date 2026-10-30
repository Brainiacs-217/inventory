-- Square OAuth connections (one per organization).
-- Column names match the inventory database.
create table public.square_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  square_merchant_id text not null,
  access_token_encrypted text,
  refresh_token_encrypted text,
  expires_at timestamptz,
  last_synced_at timestamptz,
  location_id text,
  unique (organization_id),
  unique (square_merchant_id)
);

create index square_connections_organization_id_idx
  on public.square_connections (organization_id);

alter table public.square_connections enable row level security;
