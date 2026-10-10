-- 숙소 저장 · 삭제 함수와, 숙소를 알아야 하는 기존 함수 두 개(0045 에 이어서).
-- 모두 security invoker 다 — RLS 가 그대로 걸려 멤버가 아니면 숙소도 장소도 남지 않는다.

-- 숙소 저장 — 장소 정하기 → 숙소 넣기/고치기 → 묵는 날 카드 만들기 → (기간이 줄었으면) 밀려난 카드 정리. 한 트랜잭션.
--   p_stay   null 이면 새 숙소
--   p_place  { name, lat, lng, address, address_local, address_ko, google_place_id, gmap_url }
--   p_fields { emoji, status, check_in_date, check_out_date, check_in_time, check_out_time, memo, links }
--   p_prune  true 면 옛 숙박 범위에는 있고 새 범위에는 없는 날의 연결 카드를 지운다(확인창 「지우기」)
-- 돌려주는 값 { id, added, removed } — 토스트에 쓴다.
--
-- 장소: 내가 이미 가진 구글 장소면 그것을 쓴다(places_owner_google_key). 수정인데 장소가 내 것이면 고치고,
-- 남의 것인데 이름 · 좌표가 바뀌었으면 내 사본을 만들어 바꿔 끼운다(copy-on-write — 「장소는 만든 사람만 고친다」 를 지키면서
-- 일행도 오타를 고칠 수 있게. 원본은 주인 보관함에 그대로, 2026-10-10 사용자 결정).
--
-- 카드: 새 숙소이거나 숙박 날짜가 바뀐 때만 만든다 — 메모만 고쳤는데 사용자가 지운 카드가 되살아나지 않게.
-- 체크인 ~ 체크아웃(양 끝 포함) 중 여행 기간 안의 날마다, 그날에 이 숙소의 타임라인 카드가 없을 때만 그날 끝에 하나.
-- 정리는 (옛 범위 ∖ 새 범위) 의 카드만 — 사용자가 일부러 범위 밖으로 옮겨 둔 카드는 다시 묻지 않는다.
create or replace function public.save_stay(
  p_trip uuid, p_stay uuid, p_place jsonb, p_fields jsonb, p_prune boolean default false
)
returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare
  v_name text := left(btrim(coalesce(p_place ->> 'name', '')), 100);
  v_google text := nullif(p_place ->> 'google_place_id', '');
  v_lat double precision := (p_place ->> 'lat')::double precision;
  v_lng double precision := (p_place ->> 'lng')::double precision;
  v_in date := (p_fields ->> 'check_in_date')::date;
  v_out date := (p_fields ->> 'check_out_date')::date;
  v_emoji text := left(nullif(btrim(coalesce(p_fields ->> 'emoji', '')), ''), 8);
  v_status text := nullif(p_fields ->> 'status', '');
  v_start date;
  v_end date;
  v_days int;
  v_old public.stays;
  v_cur public.places;
  v_place uuid;
  v_city text;
  v_id uuid;
  v_from int;
  v_to int;
  v_old_from int;
  v_old_to int;
  v_day int;
  v_added int := 0;
  v_removed int := 0;
begin
  if v_name = '' then
    raise exception 'stay name is required';
  end if;
  if v_lat is null or v_lng is null then
    raise exception 'stay location is required';
  end if;
  if v_in is null or v_out is null then
    raise exception 'stay dates are required';
  end if;

  -- 여행 기간. RLS 로 안 보이면 null → 거부
  select start_date, end_date into v_start, v_end from public.trips where id = p_trip;
  if v_start is null then
    raise exception 'trip not found or not a member';
  end if;
  v_days := v_end - v_start + 1;

  if p_stay is not null then
    -- 잠가서 읽는다 — 두 멤버가 동시에 고치면 뒤 사람이 앞 사람 커밋 뒤의 날짜 · 장소를 본다
    select * into v_old from public.stays where id = p_stay and trip_id = p_trip for update;
    if v_old.id is null then
      raise exception 'stay not found or not a member';
    end if;
    select * into v_cur from public.places where id = v_old.place_id;
  end if;

  -- ---------- 장소 ----------
  if v_google is not null then
    select id into v_place from public.places where created_by = auth.uid() and google_place_id = v_google;
  end if;
  if v_place is null and v_cur.id is not null then
    if v_cur.created_by = auth.uid() then
      v_place := v_cur.id;
    elsif v_cur.name = v_name and v_cur.lat = v_lat and v_cur.lng = v_lng then
      -- 남의 장소인데 바뀐 것이 없다 — 건드리지 않는다
      v_place := v_cur.id;
    end if;
  end if;

  if v_place is not null and (v_cur.id is null or v_cur.created_by = auth.uid() or v_place <> v_cur.id) then
    update public.places set
      name = v_name,
      category = coalesce(category, 'stay'),
      lat = v_lat,
      lng = v_lng,
      address = coalesce(nullif(p_place ->> 'address', ''), address),
      address_local = coalesce(nullif(p_place ->> 'address_local', ''), address_local),
      address_ko = coalesce(nullif(p_place ->> 'address_ko', ''), address_ko),
      google_place_id = coalesce(v_google, google_place_id),
      gmap_url = coalesce(nullif(p_place ->> 'gmap_url', ''), gmap_url)
    where id = v_place and created_by = auth.uid();
  elsif v_place is null then
    -- 새로 만든다. 남의 장소를 고친 것이면 그 장소의 나머지 칸을 복사한다(copy-on-write)
    v_city := coalesce(v_cur.city_id, public.place_city_for_trip(p_trip, v_lat, v_lng));
    if v_city is null then
      raise exception 'trip has no city and the place has no location';
    end if;
    insert into public.places (
      city_id, created_by, name, category, lat, lng, address, address_local, address_ko, address_detail,
      google_place_id, emoji, rating, review_count, wait, description, hours, hours_week, gmap_url, links
    ) values (
      v_city, auth.uid(), v_name, coalesce(v_cur.category, 'stay'), v_lat, v_lng,
      coalesce(nullif(p_place ->> 'address', ''), v_cur.address),
      coalesce(nullif(p_place ->> 'address_local', ''), v_cur.address_local),
      coalesce(nullif(p_place ->> 'address_ko', ''), v_cur.address_ko),
      v_cur.address_detail,
      v_google, v_cur.emoji, v_cur.rating, v_cur.review_count, v_cur.wait, v_cur.description,
      v_cur.hours, v_cur.hours_week,
      coalesce(nullif(p_place ->> 'gmap_url', ''), v_cur.gmap_url),
      coalesce(v_cur.links, '[]'::jsonb)
    )
    returning id into v_place;
  end if;

  -- ---------- 숙소 ----------
  if p_stay is null then
    insert into public.stays (
      trip_id, place_id, emoji, status, check_in_date, check_out_date, check_in_time, check_out_time, memo, links
    ) values (
      p_trip, v_place, v_emoji, v_status, v_in, v_out,
      (nullif(p_fields ->> 'check_in_time', ''))::time,
      (nullif(p_fields ->> 'check_out_time', ''))::time,
      nullif(p_fields ->> 'memo', ''),
      coalesce(p_fields -> 'links', '[]'::jsonb)
    )
    returning id into v_id;
  else
    v_id := p_stay;
    update public.stays set
      place_id = v_place, emoji = v_emoji, status = v_status,
      check_in_date = v_in, check_out_date = v_out,
      check_in_time = (nullif(p_fields ->> 'check_in_time', ''))::time,
      check_out_time = (nullif(p_fields ->> 'check_out_time', ''))::time,
      memo = nullif(p_fields ->> 'memo', ''),
      links = coalesce(p_fields -> 'links', '[]'::jsonb)
    where id = p_stay;
  end if;

  -- ---------- 연결 카드 ----------
  if p_stay is null or v_old.check_in_date <> v_in or v_old.check_out_date <> v_out then
    v_from := greatest(v_in - v_start, 0);
    v_to := least(v_out - v_start, v_days - 1);
    for v_day in v_from .. v_to loop
      if not exists (
        select 1 from public.schedule_items
        where stay_id = v_id and day_index = v_day and alternative_of is null
      ) then
        insert into public.schedule_items (
          trip_id, day_index, position, kind, place_id, stay_id, emoji, status, created_by
        ) values (
          p_trip, v_day,
          (select coalesce(max(position) + 1, 0) from public.schedule_items
            where trip_id = p_trip and day_index = v_day),
          'place', v_place, v_id, v_emoji, v_status, auth.uid()
        );
        v_added := v_added + 1;
      end if;
    end loop;

    if p_prune and p_stay is not null then
      v_old_from := greatest(v_old.check_in_date - v_start, 0);
      v_old_to := least(v_old.check_out_date - v_start, v_days - 1);
      with gone as (
        delete from public.schedule_items
        where stay_id = v_id and alternative_of is null
          and day_index between v_old_from and v_old_to
          and (v_from > v_to or day_index not between v_from and v_to)
        returning id
      )
      select count(*) into v_removed from gone;
    end if;
  end if;

  return jsonb_build_object('id', v_id, 'added', v_added, 'removed', v_removed);
end $$;
revoke all on function public.save_stay(uuid, uuid, jsonb, jsonb, boolean) from public;
grant execute on function public.save_stay(uuid, uuid, jsonb, jsonb, boolean) to authenticated;

-- 숙소 삭제. p_delete_cards 면 연결된 타임라인 카드도 지우고(메모 · 대체 장소 · 이동은 cascade), 아니면 FK 가 연결만 푼다
-- (일반 장소 카드로 남는다). 장소는 보관함에 남는다. 지운 카드 수를 돌려준다
create or replace function public.delete_stay(p_stay uuid, p_delete_cards boolean)
returns int
language plpgsql security invoker set search_path = '' as $$
declare
  v_removed int := 0;
begin
  perform 1 from public.stays where id = p_stay for update;
  if not found then
    raise exception 'stay not found or not a member';
  end if;
  if p_delete_cards then
    with gone as (
      delete from public.schedule_items where stay_id = p_stay and alternative_of is null returning id
    )
    select count(*) into v_removed from gone;
  end if;
  delete from public.stays where id = p_stay;
  return v_removed;
end $$;
revoke all on function public.delete_stay(uuid, boolean) from public;
grant execute on function public.delete_stay(uuid, boolean) to authenticated;

-- 멤버가 나가면 그 사람이 만든 장소를 소유자 사본으로 — 숙소가 쓰는 장소도 포함하고, 숙소도 사본을 가리키게 한다(0022 + 숙소)
create or replace function public.copy_places_on_leave()
returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid;
  r record;
  v_copy uuid;
begin
  select owner_id into v_owner from public.trips where id = old.trip_id;
  if v_owner is null or v_owner = old.user_id then
    return old;
  end if;

  for r in
    select distinct p.*
    from public.places p
    where p.created_by = old.user_id
      and (
        exists (select 1 from public.schedule_items si where si.place_id = p.id and si.trip_id = old.trip_id)
        or exists (select 1 from public.stays s where s.place_id = p.id and s.trip_id = old.trip_id)
      )
  loop
    v_copy := null;
    if r.google_place_id is not null then
      select id into v_copy from public.places
      where created_by = v_owner and google_place_id = r.google_place_id;
    end if;
    if v_copy is null then
      insert into public.places (
        city_id, created_by, name, google_place_id, lat, lng, address, address_local, address_ko, address_detail,
        category, emoji, rating, review_count, wait, description, hours, hours_week, gmap_url, links
      ) values (
        r.city_id, v_owner, r.name, r.google_place_id, r.lat, r.lng, r.address, r.address_local, r.address_ko, r.address_detail,
        r.category, r.emoji, r.rating, r.review_count, r.wait, r.description, r.hours, r.hours_week, r.gmap_url, r.links
      )
      returning id into v_copy;
    end if;
    update public.schedule_items set place_id = v_copy
    where trip_id = old.trip_id and place_id = r.id;
    update public.stays set place_id = v_copy
    where trip_id = old.trip_id and place_id = r.id;
  end loop;
  return old;
end $$;

-- 여행 기간 바꾸기 — 숙소도 출발일이 옮겨진 만큼 함께 옮긴다(0033 + 숙소). 일정 카드는 day_index 를 유지하므로(날짜가
-- 함께 옮겨진다) 숙소 날짜도 같이 가야 연결 카드와 어긋나지 않는다. 기간을 늘려도 카드를 새로 만들지는 않는다(다음 숙소 저장 때)
create or replace function public.update_trip_dates(p_trip_id uuid, p_start date, p_end date)
returns void
language plpgsql security invoker set search_path = public as $$
declare
  v_days int := p_end - p_start + 1;
  v_old_start date;
  v_base int;
begin
  if v_days < 1 then
    raise exception 'end date must not be before start date';
  end if;

  select start_date into v_old_start from public.trips where id = p_trip_id for update;

  update public.trips set start_date = p_start, end_date = p_end where id = p_trip_id;
  if not found then
    raise exception 'trip not found or not a member';
  end if;

  select coalesce(max(position), -1) + 1 into v_base
  from public.schedule_items
  where trip_id = p_trip_id and day_index = v_days - 1;

  update public.schedule_items s
  set day_index = v_days - 1, position = v_base + moved.ord - 1
  from (
    select id, row_number() over (order by day_index, position, created_at) as ord
    from public.schedule_items
    where trip_id = p_trip_id and day_index >= v_days
  ) moved
  where s.id = moved.id;

  update public.expenses
  set spent_on = least(spent_on + (p_start - v_old_start), p_end)
  where trip_id = p_trip_id and spent_on is not null;

  update public.stays
  set check_in_date = check_in_date + (p_start - v_old_start),
      check_out_date = check_out_date + (p_start - v_old_start)
  where trip_id = p_trip_id;

  delete from public.day_routes where trip_id = p_trip_id and day_index >= v_days;
end $$;
