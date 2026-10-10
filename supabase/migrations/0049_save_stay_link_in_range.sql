-- 「숙소로 등록」 고치기(#185 리뷰): 연결할 카드가 새 숙소의 묵는 날 안에 있을 때만 받는다.
-- 등록 폼에서 체크인을 카드 날짜와 다르게 바꾸면, 0048 은 그 카드를 묵는 날 밖의 연결 카드로 만들고 그날 카드를 또 만들었다
-- (나중에 날짜를 고쳐도 prune 은 옛 기간만 봐서 정리되지 않는다). 서명 · 권한은 0048 과 같고 그 밖도 같다.

create or replace function public.save_stay(
  p_trip uuid, p_stay uuid, p_place jsonb, p_fields jsonb, p_prune boolean default false,
  p_link_item uuid default null
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

  -- 여행 기간. RLS 로 안 보이면 null → 거부. for share 로 잠가 읽는다 — 그사이 일행이 기간을 옮기면(update_trip_dates 의 for update)
  -- 그 커밋을 기다렸다가 옮겨진 기간 · 숙소 날짜로 날 번호를 계산한다(잠그지 않으면 옛 기간으로 카드가 하루씩 밀린다)
  select start_date, end_date into v_start, v_end from public.trips where id = p_trip for share;
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
    -- 다른 곳으로 옮겼으면(구글 장소 · 좌표가 다르면) 지금 장소를 고치지도 복사하지도 않는다 — 다른 숙소다.
    -- 고치면 같은 장소를 쓰는 다른 여행(장소는 구글 id 로 여행끼리 재사용된다)의 숙소 · 카드까지 새 호텔이 된다
    if v_cur.id is not null and (
      coalesce(v_cur.google_place_id, '') <> coalesce(v_google, '')
      or v_cur.lat is distinct from v_lat
      or v_cur.lng is distinct from v_lng
    ) then
      v_cur := null;
    end if;
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

  -- ---------- 「숙소로 등록」 한 일정 카드 ----------
  -- 그 카드를 이 숙소의 연결 카드로 바꾼다(장소도 숙소 장소로). 아래에서 묵는 날마다 카드를 만들 때 그날은 이미 있다고 보고 건너뛴다
  if p_link_item is not null then
    update public.schedule_items set
      stay_id = v_id, place_id = v_place, emoji = v_emoji, status = v_status
    where id = p_link_item and trip_id = p_trip and kind = 'place'
      and alternative_of is null and stay_id is null
      -- 묵는 날(여행 기간 안의 체크인 ~ 체크아웃) 안의 카드만 — 밖이면 묵는 날 밖에 연결 카드가 남고 그날 카드가 또 생긴다
      and day_index between greatest(v_in - v_start, 0) and least(v_out - v_start, v_days - 1);
    if not found then
      raise exception 'item to link not found, already linked or outside the stay dates';
    end if;
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
