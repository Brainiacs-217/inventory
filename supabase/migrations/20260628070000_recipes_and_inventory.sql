-- Item inventory tracking columns
alter table public.items
  add column if not exists on_hand numeric default 0,
  add column if not exists last_counted_at timestamptz;

-- Recipes
create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  yield_quantity numeric,
  yield_unit text,
  serving_size_quantity numeric,
  serving_size_unit text,
  sales_price numeric not null default 0,
  misc_cost numeric not null default 0,
  food_cost numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  item_id uuid not null references public.items (id) on delete restrict,
  quantity numeric not null,
  unit text not null,
  sort_order int not null default 0
);

-- Storage rooms
create table public.storage_rooms (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.storage_room_items (
  room_id uuid not null references public.storage_rooms (id) on delete cascade,
  item_id uuid not null references public.items (id) on delete cascade,
  primary key (room_id, item_id)
);

-- Inventory check history
create table public.inventory_checks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  room_id uuid not null references public.storage_rooms (id) on delete cascade,
  saved_at timestamptz not null default now(),
  saved_by uuid references public.profiles (id)
);

create table public.inventory_check_lines (
  id uuid primary key default gen_random_uuid(),
  check_id uuid not null references public.inventory_checks (id) on delete cascade,
  item_id uuid not null references public.items (id) on delete cascade,
  previous_on_hand numeric not null,
  counted_qty numeric not null
);

-- RLS
alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.storage_rooms enable row level security;
alter table public.storage_room_items enable row level security;
alter table public.inventory_checks enable row level security;
alter table public.inventory_check_lines enable row level security;

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
    recipe_id in (
      select id from public.recipes where public.is_org_member(organization_id)
    )
  );

create policy "Members can manage recipe ingredients"
  on public.recipe_ingredients for insert to authenticated
  with check (
    recipe_id in (
      select id from public.recipes where public.is_org_member(organization_id)
    )
  );

create policy "Members can update recipe ingredients"
  on public.recipe_ingredients for update to authenticated
  using (
    recipe_id in (
      select id from public.recipes where public.is_org_member(organization_id)
    )
  );

create policy "Members can delete recipe ingredients"
  on public.recipe_ingredients for delete to authenticated
  using (
    recipe_id in (
      select id from public.recipes where public.is_org_member(organization_id)
    )
  );

create policy "Members can view org storage rooms"
  on public.storage_rooms for select to authenticated
  using (public.is_org_member(organization_id));

create policy "Members can manage org storage rooms"
  on public.storage_rooms for insert to authenticated
  with check (public.is_org_member(organization_id));

create policy "Members can update org storage rooms"
  on public.storage_rooms for update to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

create policy "Members can delete org storage rooms"
  on public.storage_rooms for delete to authenticated
  using (public.is_org_member(organization_id));

create policy "Members can view storage room items"
  on public.storage_room_items for select to authenticated
  using (
    room_id in (
      select id from public.storage_rooms where public.is_org_member(organization_id)
    )
  );

create policy "Members can manage storage room items"
  on public.storage_room_items for insert to authenticated
  with check (
    room_id in (
      select id from public.storage_rooms where public.is_org_member(organization_id)
    )
  );

create policy "Members can delete storage room items"
  on public.storage_room_items for delete to authenticated
  using (
    room_id in (
      select id from public.storage_rooms where public.is_org_member(organization_id)
    )
  );

create policy "Members can view inventory checks"
  on public.inventory_checks for select to authenticated
  using (public.is_org_member(organization_id));

create policy "Members can create inventory checks"
  on public.inventory_checks for insert to authenticated
  with check (public.is_org_member(organization_id));

create policy "Members can view inventory check lines"
  on public.inventory_check_lines for select to authenticated
  using (
    check_id in (
      select id from public.inventory_checks where public.is_org_member(organization_id)
    )
  );

create policy "Members can create inventory check lines"
  on public.inventory_check_lines for insert to authenticated
  with check (
    check_id in (
      select id from public.inventory_checks where public.is_org_member(organization_id)
    )
  );
