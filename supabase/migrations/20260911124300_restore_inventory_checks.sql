create table if not exists public.inventory_checks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  room_id uuid not null references public.storage_rooms (id) on delete cascade,
  saved_at timestamptz not null default now(),
  saved_by uuid references public.profiles (id)
);

create table if not exists public.inventory_check_lines (
  id uuid primary key default gen_random_uuid(),
  check_id uuid not null references public.inventory_checks (id) on delete cascade,
  item_id uuid not null references public.items (id) on delete cascade,
  previous_on_hand numeric not null,
  counted_qty numeric not null
);

alter table public.inventory_checks enable row level security;
alter table public.inventory_check_lines enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'inventory_checks'
      and policyname = 'Members can view inventory checks'
  ) then
    create policy "Members can view inventory checks"
      on public.inventory_checks for select to authenticated
      using (public.is_org_member(organization_id));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'inventory_checks'
      and policyname = 'Members can create inventory checks'
  ) then
    create policy "Members can create inventory checks"
      on public.inventory_checks for insert to authenticated
      with check (public.is_org_member(organization_id));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'inventory_check_lines'
      and policyname = 'Members can view inventory check lines'
  ) then
    create policy "Members can view inventory check lines"
      on public.inventory_check_lines for select to authenticated
      using (
        check_id in (
          select id from public.inventory_checks where public.is_org_member(organization_id)
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'inventory_check_lines'
      and policyname = 'Members can create inventory check lines'
  ) then
    create policy "Members can create inventory check lines"
      on public.inventory_check_lines for insert to authenticated
      with check (
        check_id in (
          select id from public.inventory_checks where public.is_org_member(organization_id)
        )
      );
  end if;
end
$$;
