-- 아이콘(이모지)은 장소가 아니라 일정에 붙인다.
--
-- 장소는 일행 · 다른 여행과 함께 쓰는 정보이고, 아이콘은 내 일정에서만 바꾸면 되는 꾸밈이다.
-- 지금까지 장소 입력 폼의 아이콘은 places.emoji 에 들어가서, 이미 있는 장소를 다시 담으면 그 장소를 쓰는
-- 모든 일정의 아이콘이 바뀌었다.
--
-- create_place_schedule 을 다시 정의한다(0022 와 같고 아이콘만 바뀐다).
--   p_item.emoji  → schedule_items.emoji (앞뒤 공백을 떼고 8자까지, 비면 null)
--   p_place.emoji → 더 읽지 않는다. 새 장소의 places.emoji 는 비고, 다시 담을 때 기존 값은 그대로 둔다
-- 이미 있는 places.emoji 는 옮기지 않는다 — 일정 카드가 일정 아이콘이 없을 때 기본값으로 계속 보인다.

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
    trip_id, day_index, position, kind, place_id, emoji, status, start_time, memo, links, created_by
  ) values (
    p_trip, p_day,
    (select coalesce(max(position) + 1, 0) from public.schedule_items
      where trip_id = p_trip and day_index = p_day),
    'place', v_place,
    left(nullif(btrim(p_item ->> 'emoji'), ''), 8),
    nullif(p_item ->> 'status', ''),
    (nullif(p_item ->> 'start_time', ''))::time,
    nullif(p_item ->> 'memo', ''),
    coalesce(p_item -> 'links', '[]'::jsonb),
    auth.uid()
  )
  returning id into v_item;
  return v_item;
end $$;
