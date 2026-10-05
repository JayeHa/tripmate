-- 대체 장소를 일정 줄로.
--
-- 지금까지 대체 장소는 일정의 jsonb 칸(alternatives: [{ name, gmap, sub }])이라 위치가 없었고, 「바꾸기」 하면
-- 위치 없는 장소가 생겼다(장소는 위치가 반드시 있다는 규칙과 어긋남). 이제 대체 장소도 일정 한 줄이다:
--   schedule_items.alternative_of = 그 대체 장소가 붙은 일정(타임라인에 있는 줄). 타임라인 · 동선은 이 칸이 빈 줄만 본다
-- 예약 상태 · 일정 링크 · 메모(앞으로 바우처 · 할 일)는 줄마다 따로라, 바꾸기 하면 각자 장소를 따라간다.
-- 시간은 「자리」 의 것이라 대체 장소 줄은 시간을 갖지 않고(check), 바꾸기 할 때 새로 들어온 줄로 옮긴다.
--
-- 지켜야 하는 것
--   * 같은 여행의 일정에만 붙는다(FK (alternative_of, trip_id)) · 원래 일정을 지우면 대체 장소도 지운다(cascade)
--   * 대체 장소의 대체 장소는 없다 — 붙을 곳은 타임라인 줄, 대체 장소가 붙은 줄은 대체 장소가 될 수 없다(트리거)
--   * 대체 장소는 원래 일정과 같은 날이다 — 넣을 때 · 원래 일정이 다른 날로 옮겨질 때 트리거가 맞춘다
--
-- 예전 jsonb 대체 장소는 개발 데이터라 옮기지 않고 칸째 지운다.

alter table public.schedule_items drop column alternatives;

alter table public.schedule_items
  add column alternative_of uuid,
  add constraint schedule_items_alternative_fkey foreign key (alternative_of, trip_id)
    references public.schedule_items (id, trip_id) on delete cascade,
  add constraint schedule_items_alternative_check
    check (alternative_of is null or (kind = 'place' and start_time is null and alternative_of <> id));

create index schedule_items_alternative_idx on public.schedule_items(alternative_of);

-- 넣거나 붙을 곳을 바꿀 때: 붙을 곳은 타임라인의 장소 줄이어야 하고, 대체 장소가 붙어 있는 줄은 대체 장소가 될 수 없다.
-- 날짜는 붙을 곳을 따른다(부른 쪽이 낡은 날짜를 보내도 맞춘다)
create or replace function public.check_schedule_alternative()
returns trigger
language plpgsql security invoker set search_path = '' as $$
declare
  v_day int;
  v_parent uuid;
  v_kind text;
begin
  if new.alternative_of is null then
    return new;
  end if;
  select day_index, alternative_of, kind into v_day, v_parent, v_kind
  from public.schedule_items where id = new.alternative_of;
  if v_kind is distinct from 'place' then
    raise exception 'alternatives belong to a place item';
  end if;
  if v_parent is not null then
    raise exception 'an alternative cannot have alternatives';
  end if;
  if exists (select 1 from public.schedule_items where alternative_of = new.id) then
    raise exception 'an item with alternatives cannot become an alternative';
  end if;
  new.day_index := coalesce(v_day, new.day_index);
  return new;
end $$;

create trigger schedule_items_alternative_check
  before insert or update of alternative_of on public.schedule_items
  for each row execute function public.check_schedule_alternative();

-- 원래 일정이 다른 날로 옮겨지면 대체 장소도 같은 날로
create or replace function public.follow_alternative_day()
returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  update public.schedule_items set day_index = new.day_index
  where alternative_of = new.id and day_index <> new.day_index;
  return null;
end $$;

create trigger schedule_items_alternative_day
  after update of day_index on public.schedule_items
  for each row when (new.alternative_of is null and old.day_index <> new.day_index)
  execute function public.follow_alternative_day();

-- 「바꾸기」: 대체 장소 p_alt 가 그 자리(날짜 · 순서 · 시간)에 들어가고, 원래 일정은 p_alt 의 대체 장소가 된다.
-- 원래 일정의 다른 대체 장소들도 p_alt 에 붙는다. 앞뒤 이동 기록(moves)은 자리의 것이라 p_alt 로 옮긴다.
-- 예약 상태 · 링크 · 메모는 줄마다 그대로라 각자 장소를 따라간다. 권한은 RLS(여행 멤버)
create or replace function public.swap_alternative(p_alt uuid)
returns void
language plpgsql security invoker set search_path = '' as $$
declare
  v_main public.schedule_items;
  v_alt public.schedule_items;
begin
  select * into v_alt from public.schedule_items where id = p_alt;
  if v_alt.id is null or v_alt.alternative_of is null then
    raise exception 'not an alternative';
  end if;
  select * into v_main from public.schedule_items where id = v_alt.alternative_of;

  update public.moves set from_item_id = v_alt.id where from_item_id = v_main.id;
  update public.moves set to_item_id = v_alt.id where to_item_id = v_main.id;

  update public.schedule_items set
    alternative_of = null, day_index = v_main.day_index, position = v_main.position, start_time = v_main.start_time
  where id = v_alt.id;
  update public.schedule_items set alternative_of = v_alt.id
  where alternative_of = v_main.id;
  update public.schedule_items set alternative_of = v_alt.id, start_time = null, position = v_alt.position
  where id = v_main.id;
  if not found then
    raise exception 'item not found or not a member';
  end if;
end $$;

-- create_place_schedule: p_item.alternative_of 가 있으면 그 일정의 대체 장소로 넣는다(장소 입력 폼의 「대체 장소 직접 추가」).
-- 날짜는 트리거가 맞추고, 대체 장소는 시간을 갖지 않는다. 그 밖은 0023 과 같다
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
    trip_id, day_index, position, kind, place_id, alternative_of, emoji, status, start_time, memo, links, created_by
  ) values (
    p_trip, p_day,
    (select coalesce(max(position) + 1, 0) from public.schedule_items
      where trip_id = p_trip and day_index = p_day),
    'place', v_place,
    v_alt,
    left(nullif(btrim(p_item ->> 'emoji'), ''), 8),
    nullif(p_item ->> 'status', ''),
    case when v_alt is null then (nullif(p_item ->> 'start_time', ''))::time end,
    nullif(p_item ->> 'memo', ''),
    coalesce(p_item -> 'links', '[]'::jsonb),
    auth.uid()
  )
  returning id into v_item;
  return v_item;
end $$;
