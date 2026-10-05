-- 메모를 목록으로.
--
-- 지금까지 메모는 일정의 글 한 칸(schedule_items.memo, 줄마다 하나)이었다. 이제 메모 하나가 한 줄(memos)이고
-- 작성자 · ★ 중요 · 링크(제목 + URL)를 갖는다. 메모는 일정 줄에 붙는다 — 대체 장소 줄에도 붙어 「바꾸기」 하면
-- 장소를 따라간다(0024 의 규칙과 같다).
--
-- 권한: 여행 멤버 누구나 쓰고 · 고치고 · 지운다(사용자 결정 2026-10-05). 익명(둘러보기)은 자기 여행에서만 쓰므로 그대로 둔다.
-- 작성자(author_id)는 넣을 때 auth.uid() 로 채우고 나중에 바꾸지 않는다(트리거).
--
-- 기존 메모 옮기기: 한 줄 = 메모 하나. 작성자는 그 일정을 만든 사람, 「★ 」로 시작하는 줄은 중요(★ 는 뗀다).
-- 줄 순서는 created_at 에 줄 번호만큼 마이크로초를 더해 지킨다. 옮긴 뒤 옛 칸을 지운다(개발 데이터).
-- create_place_schedule 은 옛 칸에 쓰던 p_item.memo 를 빼고 다시 정의한다(0024 와 같고 memo 만 빠진다).

create table public.memos (
  id               uuid primary key default gen_random_uuid(),
  trip_id          uuid not null references public.trips(id) on delete cascade,
  schedule_item_id uuid not null,
  author_id        uuid references public.profiles(id) on delete set null,
  body             text not null check (char_length(btrim(body)) between 1 and 500),
  starred          boolean not null default false,
  links            jsonb not null default '[]' check (jsonb_typeof(links) = 'array'),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  -- 같은 여행의 일정에만 붙고, 일정을 지우면 함께 지워진다
  foreign key (schedule_item_id, trip_id) references public.schedule_items (id, trip_id) on delete cascade
);

create index memos_item_idx on public.memos(schedule_item_id);
create index memos_trip_idx on public.memos(trip_id);

create trigger memos_updated_at before update on public.memos
  for each row execute function public.set_updated_at();

-- 작성자는 넣을 때만 정해지고(남의 이름으로 쓰지 못한다) 고칠 때는 바뀌지 않는다
create or replace function public.keep_memo_author()
returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.author_id := auth.uid();
  else
    new.author_id := old.author_id;
  end if;
  return new;
end $$;

create trigger memos_author before insert or update on public.memos
  for each row execute function public.keep_memo_author();

alter table public.memos enable row level security;

create policy "memos_all" on public.memos
  for all to authenticated
  using (public.is_trip_member(trip_id))
  with check (public.is_trip_member(trip_id));

alter publication supabase_realtime add table public.memos;
alter table public.memos replica identity full;

-- 기존 메모 옮기기. 트리거가 작성자를 auth.uid()(마이그레이션에서는 null)로 덮지 않게 잠깐 끈다
alter table public.memos disable trigger memos_author;
insert into public.memos (trip_id, schedule_item_id, author_id, body, starred, created_at, updated_at)
select si.trip_id, si.id, si.created_by,
       left(btrim(regexp_replace(line.text, '^★\s*', '')), 500),
       line.text ~ '^★',
       si.created_at + line.n * interval '1 microsecond',
       si.updated_at
from public.schedule_items si
cross join lateral regexp_split_to_table(si.memo, E'\n') with ordinality as line(text, n)
where si.memo is not null
  and btrim(regexp_replace(line.text, '^★\s*', '')) <> '';
alter table public.memos enable trigger memos_author;

alter table public.schedule_items drop column memo;

create or replace function public.create_place_schedule(p_trip uuid, p_day int, p_place jsonb, p_item jsonb)
returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_name text := left(btrim(coalesce(p_place ->> 'name', '')), 100);
  v_google text := nullif(p_place ->> 'google_place_id', '');
  v_lat double precision := (p_place ->> 'lat')::double precision;
  v_lng double precision := (p_place ->> 'lng')::double precision;
  v_links jsonb := coalesce(p_place -> 'links', '[]'::jsonb);
  v_city text;
  v_place uuid;
  v_item uuid;
  v_alt uuid := nullif(p_item ->> 'alternative_of', '')::uuid;
begin
  if v_name = '' then
    raise exception 'place name is required';
  end if;

  if v_google is not null then
    select id into v_place from public.places
    where created_by = auth.uid() and google_place_id = v_google;
  end if;

  if v_place is not null then
    update public.places set
      name = v_name,
      category = coalesce(nullif(p_place ->> 'category', ''), category),
      lat = coalesce(v_lat, lat),
      lng = coalesce(v_lng, lng),
      address = coalesce(nullif(p_place ->> 'address', ''), address),
      address_local = coalesce(nullif(p_place ->> 'address_local', ''), address_local),
      address_ko = coalesce(nullif(p_place ->> 'address_ko', ''), address_ko),
      address_detail = coalesce(nullif(p_place ->> 'address_detail', ''), address_detail),
      hours = coalesce(nullif(p_place ->> 'hours', ''), hours),
      hours_week = coalesce(nullif(p_place -> 'hours_week', 'null'::jsonb), hours_week),
      rating = coalesce((p_place ->> 'rating')::numeric, rating),
      review_count = coalesce((p_place ->> 'review_count')::int, review_count),
      wait = coalesce(nullif(p_place ->> 'wait', ''), wait),
      description = coalesce(nullif(p_place ->> 'description', ''), description),
      gmap_url = coalesce(nullif(p_place ->> 'gmap_url', ''), gmap_url),
      links = case when jsonb_array_length(v_links) > 0 then v_links else links end
    where id = v_place;
  else
    v_city := public.place_city_for_trip(p_trip, v_lat, v_lng);
    if v_city is null then
      raise exception 'trip has no city and the place has no location';
    end if;

    insert into public.places (
      city_id, name, category, lat, lng, address, address_local, address_ko, address_detail, google_place_id,
      hours, hours_week, rating, review_count, wait, description, gmap_url, links
    ) values (
      v_city, v_name,
      nullif(p_place ->> 'category', ''),
      v_lat, v_lng,
      nullif(p_place ->> 'address', ''),
      nullif(p_place ->> 'address_local', ''),
      nullif(p_place ->> 'address_ko', ''),
      nullif(p_place ->> 'address_detail', ''),
      v_google,
      nullif(p_place ->> 'hours', ''),
      nullif(p_place -> 'hours_week', 'null'::jsonb),
      (p_place ->> 'rating')::numeric,
      (p_place ->> 'review_count')::int,
      nullif(p_place ->> 'wait', ''),
      nullif(p_place ->> 'description', ''),
      nullif(p_place ->> 'gmap_url', ''),
      v_links
    )
    returning id into v_place;
  end if;

  insert into public.schedule_items (
    trip_id, day_index, position, kind, place_id, alternative_of, emoji, status, start_time, links, created_by
  ) values (
    p_trip, p_day,
    (select coalesce(max(position) + 1, 0) from public.schedule_items
      where trip_id = p_trip and day_index = p_day),
    'place', v_place,
    v_alt,
    left(nullif(btrim(p_item ->> 'emoji'), ''), 8),
    nullif(p_item ->> 'status', ''),
    case when v_alt is null then (nullif(p_item ->> 'start_time', ''))::time end,
    coalesce(p_item -> 'links', '[]'::jsonb),
    auth.uid()
  )
  returning id into v_item;
  return v_item;
end $$;
