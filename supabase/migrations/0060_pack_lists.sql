-- 노트 · 준비물 · 쇼핑 (#16).
--
-- 여행의 준비물 · 쇼핑 목록. 둘은 같은 모양이라(시안도 같은 화면) 한 쌍의 테이블에 kind 로 나눈다.
-- 일행이 함께 보고 고친다(여행 멤버 누구나). 「내 것 / 공유」 구분은 없다(시안).
--   * 그룹: 이름(이모지는 이름 앞에 그대로) · 순서(position, 새 그룹은 맨 뒤)
--   * 항목: 이름(수량도 이름에) · 메모 한 줄 · 순서 · 챙김(체크한 사람 · 시각). 체크해도 자리는 그대로다
--   * 체크한 사람이 여행을 나가 프로필이 지워져도 챙김은 남는다(checked_at 이 기준, checked_by 만 비운다)
--   * 쇼핑의 참고 사진은 쇼핑 단계에서 더한다

create table public.pack_groups (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references public.trips(id) on delete cascade,
  kind        text not null check (kind in ('pack', 'shop')),
  name        text not null check (char_length(btrim(name)) between 1 and 40),
  position    integer not null default 0,
  created_by  uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- 항목이 같은 여행의 그룹에만 붙게(복합 FK)
  constraint pack_groups_id_trip_key unique (id, trip_id)
);
create index pack_groups_trip_idx on public.pack_groups(trip_id);

create table public.pack_items (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references public.trips(id) on delete cascade,
  group_id    uuid not null,
  name        text not null check (char_length(btrim(name)) between 1 and 100),
  memo        text not null default '' check (char_length(memo) <= 200),
  position    integer not null default 0,
  checked_at  timestamptz,
  checked_by  uuid references public.profiles(id) on delete set null,
  created_by  uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- 그룹을 지우면 항목도 지워진다. 다른 여행의 그룹으로는 옮기지 못한다
  constraint pack_items_group_fkey foreign key (group_id, trip_id)
    references public.pack_groups(id, trip_id) on delete cascade,
  -- 체크한 사람은 챙겼을 때만
  constraint pack_items_checked_chk check (checked_at is not null or checked_by is null)
);
create index pack_items_trip_idx on public.pack_items(trip_id);
create index pack_items_group_idx on public.pack_items(group_id);

create trigger pack_groups_updated_at before update on public.pack_groups
  for each row execute function public.set_updated_at();
create trigger pack_items_updated_at before update on public.pack_items
  for each row execute function public.set_updated_at();

-- ---------- RLS ----------
alter table public.pack_groups enable row level security;
alter table public.pack_items enable row level security;

-- 멤버만. 익명도 자기 여행이면 된다(둘러보기)
create policy "pack_groups_all" on public.pack_groups
  for all to authenticated
  using (public.is_trip_member(trip_id))
  with check (public.is_trip_member(trip_id));
create policy "pack_items_all" on public.pack_items
  for all to authenticated
  using (public.is_trip_member(trip_id))
  with check (public.is_trip_member(trip_id));

-- ---------- 기본 목록 ----------
-- 그룹 여러 개와 그 항목을 한 번에 넣는다(「기본 목록으로 시작」). 중간에 실패하면 아무것도 남지 않게 한 트랜잭션.
-- invoker 라 RLS 가 그대로 걸린다(멤버만). p_groups = [{ name, items: [name, …] }, …], 기존 그룹 뒤에 붙인다
create function public.add_pack_groups(p_trip uuid, p_kind text, p_groups jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  g jsonb;
  gid uuid;
  base integer;
  i integer := 0;
begin
  if jsonb_typeof(p_groups) <> 'array' or jsonb_array_length(p_groups) > 20 then
    raise exception 'invalid groups' using errcode = '22023';
  end if;
  select coalesce(max(position) + 1, 0) into base
    from public.pack_groups where trip_id = p_trip and kind = p_kind;
  for g in select * from jsonb_array_elements(p_groups) loop
    insert into public.pack_groups (trip_id, kind, name, position)
      values (p_trip, p_kind, g->>'name', base + i)
      returning id into gid;
    insert into public.pack_items (trip_id, group_id, name, position)
      select p_trip, gid, item.value, item.ordinality - 1
        from jsonb_array_elements_text(coalesce(g->'items', '[]'::jsonb))
          with ordinality as item(value, ordinality);
    i := i + 1;
  end loop;
end;
$$;

-- 실시간: 일행이 넣고 체크한 항목이 바로 보이게
alter publication supabase_realtime add table public.pack_groups;
alter publication supabase_realtime add table public.pack_items;
alter table public.pack_groups replica identity full;
alter table public.pack_items replica identity full;
