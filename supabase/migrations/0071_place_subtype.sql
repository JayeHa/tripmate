-- 장소의 메뉴 · 종류(#17 ⑤-c-3) — 홈 가이드 「메뉴 ⌄」 · 「종류 ⌄」 필터.
--
-- 카테고리 아래 한 단계. 식당(음식점 · 카페) = 스시 · 라멘·면 · 텐동·덮밥 · 장어 · 고기·야키니쿠 · 야키토리·꼬치 · 이자카야 ·
-- 돈카츠·카레·양식 · 몬자·철판 · 카페·디저트·빵, 쇼핑 = 러닝·스포츠 · 캐릭터·굿즈 · 드럭·잡화·마트 · 면세·공항,
-- 휴식 = 온천·스파 · 마사지 · 발 마사지. 관광지 · 숙소 · 공항은 없다. 비어 있으면 「기타」.
-- 목록 · 이름표는 화면(entities/schedule-item 의 place-subtype)에 있고 DB 는 값의 범위만 지킨다.
-- 카테고리와 맞는지는 화면이 지킨다(장소 입력이 그 카테고리에 없는 값을 비운다).
--
-- 처음 값은 장소 입력에서 구글 종류로 채운다(사용자가 고친다). 일정 추가 검색으로 넣은 장소는 카테고리처럼 비어 있다.
-- 지금 있는 장소는 이름 · 설명 글자로 한 번 채운다(시안의 분류 규칙). 맞지 않으면 비워 둔다 — 휴식만 시안처럼 나머지를 온천 · 스파로.
-- 설명에 「장어덮밥」 · 「로스트비프 덮밥」 처럼 덮밥이 흔해 장어 · 고기를 덮밥보다 먼저 본다.

alter table public.places add column subtype text check (subtype in (
  'sushi', 'ramen', 'tendon', 'unagi', 'yakiniku', 'yakitori', 'izakaya', 'yoshoku', 'monja', 'sweets',
  'running', 'character', 'drugstore', 'dutyfree',
  'onsen', 'massage', 'foot'
));

-- 장소 저장(일정 직접 추가 · 가이드)이 종류도 받는다 — 0070 과 같고 subtype 만 더한다
create or replace function public.upsert_my_place(p_trip uuid, p_place jsonb)
returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_name text := left(btrim(coalesce(p_place ->> 'name', '')), 100);
  v_google text := nullif(p_place ->> 'google_place_id', '');
  v_lat double precision := (p_place ->> 'lat')::double precision;
  v_lng double precision := (p_place ->> 'lng')::double precision;
  v_links jsonb := coalesce(p_place -> 'links', '[]'::jsonb);
  v_emoji text := left(nullif(btrim(p_place ->> 'emoji'), ''), 8);
  v_area text := nullif(p_place ->> 'area_id', '');
  v_subtype text := nullif(p_place ->> 'subtype', '');
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
      area_id = coalesce(v_area, area_id),
      subtype = coalesce(v_subtype, subtype),
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
    city_id, name, category, subtype, emoji, area_id, lat, lng, address, address_local, address_ko, address_detail, google_place_id,
    hours, hours_week, rating, review_count, wait, description, gmap_url, links
  ) values (
    v_city, v_name,
    nullif(p_place ->> 'category', ''),
    v_subtype,
    v_emoji,
    v_area,
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

-- 나간 멤버의 장소 → 소유자 사본: 0070 과 같고 종류(subtype)만 더한다
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
        or exists (select 1 from public.trip_places tp where tp.place_id = p.id and tp.trip_id = old.trip_id)
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
        category, subtype, emoji, area_id, rating, review_count, wait, description, hours, hours_week, gmap_url, links
      ) values (
        r.city_id, v_owner, r.name, r.google_place_id, r.lat, r.lng, r.address, r.address_local, r.address_ko, r.address_detail,
        r.category, r.subtype, r.emoji, r.area_id, r.rating, r.review_count, r.wait, r.description, r.hours, r.hours_week, r.gmap_url, r.links
      )
      returning id into v_copy;
    end if;
    if exists (select 1 from public.trip_places where trip_id = old.trip_id and place_id = v_copy) then
      delete from public.trip_places where trip_id = old.trip_id and place_id = r.id;
    else
      update public.trip_places set place_id = v_copy where trip_id = old.trip_id and place_id = r.id;
    end if;
    update public.schedule_items set place_id = v_copy
    where trip_id = old.trip_id and place_id = r.id;
    update public.stays set place_id = v_copy
    where trip_id = old.trip_id and place_id = r.id;
  end loop;
  return old;
end $$;

-- 지금 있는 장소 채우기. 이름으로 먼저 가르고, 이름으로 안 갈리면 이름 + 설명으로(설명의 「장어 튀김」 이 텐동집을 장어로 보내지 않게).
-- 고친 시각(updated_at)은 그대로 둔다
create function pg_temp.guess_subtype(p_category text, s text)
returns text
language sql immutable as $$
  select case
    when p_category in ('food', 'cafe') then case
      when s ~* '스시|초밥|sushi' then 'sushi'
      when s ~* '라멘|소바|우동|츠케멘|마제|soba|udon' then 'ramen'
      when s ~* '장어|우나기|unagi' then 'unagi'
      when s ~* '야키니쿠|와규|규카츠|스테이크|베부야|타키비|로스트비프' then 'yakiniku'
      when s ~* '텐동|텐푸라|덴푸라|덮밥|돈부리|규동|Yoshinoya' then 'tendon'
      when s ~* '야키토리|꼬치|야키톤' then 'yakitori'
      when s ~* '이자카야|사카바|사케' then 'izakaya'
      when s ~* '돈카츠|카레|오므|함바그|요쇼쿠|양식|하야시' then 'yoshoku'
      when s ~* '몬자|오코노미|텟판' then 'monja'
      when s ~* '카페|커피|COFFEE|팬케이크|베이커리|빵|당고|켄피|푸딩|크레페|파르페|FRUIT|스타벅스' then 'sweets'
    end
    when p_category = 'shop' then case
      when s ~* '아식스|ASICS|러닝|룰루|PUMA|푸마|알펜' or s ~ '(^| )On ' then 'running'
      when s ~* '치이카와|가샤폰|가챠|키디랜드|굿즈|모구모구|산리오|포켓몬|애니메이트|K-BOOKS|라신반' then 'character'
      when s ~* '돈키호테|다이소|세이유|드럭|마츠모토|무인양품|로프트|핸즈' then 'drugstore'
      when s ~* '면세|공항|Fa-So-La' then 'dutyfree'
    end
    when p_category = 'rest' then case
      when s ~* '발 마사지|발 지압|아시츠보' then 'foot'
      when s ~* '마사지' then 'massage'
    end
  end
$$;

alter table public.places disable trigger places_updated_at;
update public.places set subtype = coalesce(
  pg_temp.guess_subtype(category, name),
  -- 휴식은 이름만 — 스파 설명에 「마사지」 가 흔하다
  case when category <> 'rest' then pg_temp.guess_subtype(category, name || ' ' || coalesce(description, '')) end,
  -- 카페는 카페 · 디저트 · 빵, 휴식은 시안처럼 나머지를 온천 · 스파로
  case category when 'cafe' then 'sweets' when 'rest' then 'onsen' end
)
where subtype is null and category in ('food', 'cafe', 'shop', 'rest');
alter table public.places enable trigger places_updated_at;
