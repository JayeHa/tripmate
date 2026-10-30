-- 홈 가이드 「장소 추가 → 장소 저장」(#17 ⑤-b-2) — 장소를 만들어(이미 가진 구글 장소면 고쳐 쓰고) 이 여행 보관함에 넣는다.
--
-- 장소를 만들거나 고쳐 쓰는 부분은 일정 직접 추가(create_place_schedule)와 같다. upsert_my_place 로 빼서 둘이 같이 쓴다 —
-- 장소 칸이 늘 때 한 곳만 고치면 된다. create_place_schedule 은 그 부분만 바뀌고 동작은 0027 과 같다.
--
-- 아이콘: 일정 직접 추가는 일정 줄에 붙이고(0023) p_place.emoji 를 보내지 않는다. 가이드는 일정 줄이 없어서 장소의 기본 아이콘으로 넣는다.
-- 이미 가진 장소를 다시 저장할 때는 기본 아이콘이 비어 있을 때만 채운다 — 그 장소를 쓰는 다른 여행의 카드 아이콘이 바뀌지 않게.
--
-- 모두 security invoker 라 places · trip_places · schedule_items 정책이 그대로 걸린다.

create function public.upsert_my_place(p_trip uuid, p_place jsonb)
returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_name text := left(btrim(coalesce(p_place ->> 'name', '')), 100);
  v_google text := nullif(p_place ->> 'google_place_id', '');
  v_lat double precision := (p_place ->> 'lat')::double precision;
  v_lng double precision := (p_place ->> 'lng')::double precision;
  v_links jsonb := coalesce(p_place -> 'links', '[]'::jsonb);
  v_emoji text := left(nullif(btrim(p_place ->> 'emoji'), ''), 8);
  v_city text;
  v_place uuid;
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
      emoji = coalesce(emoji, v_emoji),
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
    return v_place;
  end if;

  v_city := public.place_city_for_trip(p_trip, v_lat, v_lng);
  if v_city is null then
    raise exception 'trip has no city and the place has no location';
  end if;

  insert into public.places (
    city_id, name, category, emoji, lat, lng, address, address_local, address_ko, address_detail, google_place_id,
    hours, hours_week, rating, review_count, wait, description, gmap_url, links
  ) values (
    v_city, v_name,
    nullif(p_place ->> 'category', ''),
    v_emoji,
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
  return v_place;
end $$;

revoke all on function public.upsert_my_place(uuid, jsonb) from public;
grant execute on function public.upsert_my_place(uuid, jsonb) to authenticated;

create or replace function public.create_place_schedule(p_trip uuid, p_day int, p_place jsonb, p_item jsonb)
returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_place uuid;
  v_item uuid;
  v_alt uuid := nullif(p_item ->> 'alternative_of', '')::uuid;
begin
  -- 아이콘은 일정 줄에만(0023) — 장소의 기본 아이콘은 건드리지 않는다
  v_place := public.upsert_my_place(p_trip, p_place - 'emoji');

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

-- 장소를 저장하고 보관함에 넣는다. 이미 보관함에 있으면 그대로(담은 사람 · 메모 · 순서 유지). 장소 id 를 돌려준다
create function public.save_guide_place(p_trip uuid, p_place jsonb)
returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_place uuid;
begin
  -- 멤버가 아니면 장소부터 만들지 않는다(보관함 정책에서 막혀도 롤백되지만, 이유가 분명한 오류로)
  if not public.is_trip_member(p_trip) then
    raise exception 'trip not found or not a member';
  end if;
  v_place := public.upsert_my_place(p_trip, p_place);
  insert into public.trip_places (trip_id, place_id, added_by)
  values (p_trip, v_place, auth.uid())
  on conflict do nothing;
  return v_place;
end $$;

revoke all on function public.save_guide_place(uuid, jsonb) from public;
grant execute on function public.save_guide_place(uuid, jsonb) to authenticated;
