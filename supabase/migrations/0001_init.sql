create extension if not exists pgcrypto with schema extensions;

-- ---------- profiles ----------
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- trips ----------
create table public.trips (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references public.profiles(id),
  title          text not null,
  destination    text,
  start_date     date not null,
  end_date       date not null,
  home_currency  text not null default 'KRW',
  -- {"JPY": {"unit": 100, "value": 900}} => 100 JPY = 900 KRW
  exchange_rates jsonb not null default '{}'::jsonb,
  invite_token   text not null unique default encode(extensions.gen_random_bytes(16), 'hex'),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint trips_dates_chk check (end_date >= start_date)
);

-- ---------- trip_members ----------
create table public.trip_members (
  trip_id   uuid not null references public.trips(id) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  role      text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);
create index trip_members_user_idx on public.trip_members(user_id);

create or replace function public.handle_new_trip()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.trip_members (trip_id, user_id, role) values (new.id, new.owner_id, 'owner');
  return new;
end $$;

create trigger on_trip_created after insert on public.trips
  for each row execute function public.handle_new_trip();

-- ---------- schedule_items ----------
create table public.schedule_items (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid not null references public.trips(id) on delete cascade,
  day_index  int  not null check (day_index >= 0),
  position   int  not null,
  name       text not null,
  place_id   text,
  lat        double precision,
  lng        double precision,
  address    text,
  start_time time,
  memo       text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index schedule_items_order_idx on public.schedule_items(trip_id, day_index, position);

-- cached Routes API result per (trip, day, mode)
create table public.day_routes (
  trip_id     uuid not null references public.trips(id) on delete cascade,
  day_index   int  not null,
  travel_mode text not null default 'WALK' check (travel_mode in ('WALK', 'TRANSIT')),
  items_hash  text not null,
  polyline    text not null,
  legs        jsonb not null,
  computed_at timestamptz not null default now(),
  primary key (trip_id, day_index, travel_mode)
);

-- ---------- expenses ----------
create table public.expenses (
  id               uuid primary key default gen_random_uuid(),
  trip_id          uuid not null references public.trips(id) on delete cascade,
  schedule_item_id uuid references public.schedule_items(id) on delete set null,
  payer_id         uuid not null references public.profiles(id),
  amount           numeric(14,2) not null check (amount > 0),
  currency         text not null,
  category         text not null default 'other'
                   check (category in ('food', 'transport', 'lodging', 'shopping', 'activity', 'other')),
  memo             text,
  spent_on         date not null,
  split_mode       text not null default 'equal' check (split_mode in ('equal', 'custom')),
  created_by       uuid references public.profiles(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index expenses_trip_day_idx on public.expenses(trip_id, spent_on);

create table public.expense_splits (
  expense_id uuid not null references public.expenses(id) on delete cascade,
  user_id    uuid not null references public.profiles(id),
  share      numeric(14,2) not null check (share >= 0),
  primary key (expense_id, user_id)
);

-- ---------- updated_at ----------
create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger trips_updated_at before update on public.trips
  for each row execute function public.set_updated_at();
create trigger schedule_items_updated_at before update on public.schedule_items
  for each row execute function public.set_updated_at();
create trigger expenses_updated_at before update on public.expenses
  for each row execute function public.set_updated_at();

-- ---------- RLS ----------
alter table public.profiles       enable row level security;
alter table public.trips          enable row level security;
alter table public.trip_members   enable row level security;
alter table public.schedule_items enable row level security;
alter table public.day_routes     enable row level security;
alter table public.expenses       enable row level security;
alter table public.expense_splits enable row level security;

create or replace function public.is_trip_member(p_trip_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.trip_members m
    where m.trip_id = p_trip_id and m.user_id = auth.uid()
  );
$$;

create policy "profiles_select" on public.profiles
  for select to authenticated using (true);
create policy "profiles_update_self" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "trips_select_member" on public.trips
  for select to authenticated using (public.is_trip_member(id));
create policy "trips_insert_owner" on public.trips
  for insert to authenticated with check (owner_id = auth.uid());
create policy "trips_update_member" on public.trips
  for update to authenticated using (public.is_trip_member(id)) with check (public.is_trip_member(id));
create policy "trips_delete_owner" on public.trips
  for delete to authenticated using (owner_id = auth.uid());

create policy "members_select" on public.trip_members
  for select to authenticated using (public.is_trip_member(trip_id));
create policy "members_delete" on public.trip_members
  for delete to authenticated using (
    user_id = auth.uid()
    or exists (select 1 from public.trips t where t.id = trip_id and t.owner_id = auth.uid())
  );

create policy "items_all" on public.schedule_items
  for all to authenticated using (public.is_trip_member(trip_id)) with check (public.is_trip_member(trip_id));
create policy "routes_all" on public.day_routes
  for all to authenticated using (public.is_trip_member(trip_id)) with check (public.is_trip_member(trip_id));
create policy "expenses_all" on public.expenses
  for all to authenticated using (public.is_trip_member(trip_id)) with check (public.is_trip_member(trip_id));

create policy "splits_all" on public.expense_splits
  for all to authenticated
  using (exists (select 1 from public.expenses e where e.id = expense_id and public.is_trip_member(e.trip_id)))
  with check (exists (select 1 from public.expenses e where e.id = expense_id and public.is_trip_member(e.trip_id)));

-- ---------- invite RPCs ----------
create or replace function public.join_trip_by_token(p_token text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_trip_id uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select id into v_trip_id from public.trips where invite_token = p_token;
  if v_trip_id is null then raise exception 'invalid invite token'; end if;
  insert into public.trip_members (trip_id, user_id, role) values (v_trip_id, auth.uid(), 'member')
  on conflict do nothing;
  return v_trip_id;
end $$;

create or replace function public.get_trip_preview(p_token text)
returns table (id uuid, title text, destination text, start_date date, end_date date, member_count bigint)
language sql stable security definer set search_path = public as $$
  select t.id, t.title, t.destination, t.start_date, t.end_date,
         (select count(*) from public.trip_members m where m.trip_id = t.id)
  from public.trips t where t.invite_token = p_token;
$$;

create or replace function public.rotate_invite_token(p_trip_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare v_token text;
begin
  if not public.is_trip_member(p_trip_id) then raise exception 'forbidden'; end if;
  update public.trips set invite_token = encode(extensions.gen_random_bytes(16), 'hex')
  where id = p_trip_id returning invite_token into v_token;
  return v_token;
end $$;

revoke all on function public.join_trip_by_token(text) from public;
revoke all on function public.get_trip_preview(text) from public;
revoke all on function public.rotate_invite_token(uuid) from public;
grant execute on function public.join_trip_by_token(text) to authenticated;
grant execute on function public.get_trip_preview(text) to authenticated, anon;
grant execute on function public.rotate_invite_token(uuid) to authenticated;
