-- 별점을 「이 여행의 장소 × 사람」 에 하나로 (#313 4차 ②, 2026-11-12 핸드오프).
--
-- 0084 는 일정 × 사람에 하나였다. 같은 숙소를 여러 번 들르면 카드마다 따로 매겨야 했다.
--   * 키는 (여행, 장소키, 사람). 장소키 = 구글 장소 ID, 없으면(직접 입력 장소) 장소 행 id(사용자 결정 2026-11-12 — 이름 · 거리로 짐작하지 않는다)
--   * 같은 장소를 여러 번 들러도 하나 — 어느 카드에서 바꿔도 모두 바뀐다. 다른 여행은 따로(히스토리는 만들지 않는다, 사용자 결정)
--   * 저장은 rate_place(일정 id, 별 수, 누른 시각) — 장소키를 DB 가 일정에서 구한다. 화면 · 오프라인 대기열이 보내는 값은 그대로다
--   * 일정을 지워도 별점은 남는다(장소에 붙는다). 그 여행에 그 장소가 다시 없으면 화면에 보이지 않을 뿐이다. 여행을 지우면 함께 지워진다
--
-- 권한은 0084 그대로: 멤버가 함께 읽고, 넣기 · 바꾸기 · 지우기는 내 줄만. 익명(둘러보기)도 자기 여행이면 된다.

alter table public.place_ratings add column place_key text;

update public.place_ratings r
set place_key = coalesce(p.google_place_id, p.id::text)
from public.schedule_items si
join public.places p on p.id = si.place_id
where si.id = r.item_id;

-- 장소를 찾지 못한 줄(있으면 안 된다)과, 같은 장소에 여러 번 매긴 줄 중 나중 것이 아닌 줄을 지운다
delete from public.place_ratings where place_key is null;
delete from public.place_ratings r
using public.place_ratings s
where r.trip_id = s.trip_id
  and r.place_key = s.place_key
  and r.user_id = s.user_id
  and (r.rated_at, r.item_id) < (s.rated_at, s.item_id);

drop trigger place_ratings_guard on public.place_ratings;
alter table public.place_ratings drop constraint place_ratings_pkey;
alter table public.place_ratings drop column item_id; -- 복합 FK 도 함께 사라진다
alter table public.place_ratings alter column place_key set not null;
alter table public.place_ratings add primary key (trip_id, place_key, user_id);

-- 그 여행 일정에 있는 장소의 키에만 매긴다(항공편 · 노트는 장소가 없어 걸러진다)
create or replace function public.place_rating_guard()
returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  -- 보이지 않는 여행(남의 여행)은 여기서도 못 찾는다 — 어느 쪽이든 거부된다
  if not exists (
    select 1
    from public.schedule_items si
    join public.places p on p.id = si.place_id
    where si.trip_id = new.trip_id and coalesce(p.google_place_id, p.id::text) = new.place_key
  ) then
    raise exception 'place_ratings: 이 여행 일정에 있는 장소에만 별점을 매긴다' using errcode = 'check_violation';
  end if;
  return new;
end $$;

create trigger place_ratings_guard before insert or update on public.place_ratings
  for each row execute function public.place_rating_guard();

-- 일정 하나에서 그 장소의 내 별점을 바꾼다. 0 이면 지운다 — 두 번 올라가도 결과가 같다(오프라인 대기열).
-- 호출자 권한(RLS)으로 돈다. 일정이 이미 지워졌으면 지우기는 그냥 끝내고, 매기기는 거부한다
create function public.rate_place(p_item uuid, p_stars smallint, p_at timestamptz)
returns void
language plpgsql security invoker set search_path = '' as $$
declare
  v_trip uuid;
  v_key  text;
begin
  select si.trip_id, coalesce(p.google_place_id, p.id::text)
  into v_trip, v_key
  from public.schedule_items si
  join public.places p on p.id = si.place_id
  where si.id = p_item;

  if v_key is null then
    if p_stars = 0 then
      return;
    end if;
    raise exception 'rate_place: 장소 일정에만 별점을 매긴다' using errcode = 'check_violation';
  end if;

  if p_stars = 0 then
    delete from public.place_ratings
    where trip_id = v_trip and place_key = v_key and user_id = auth.uid();
    return;
  end if;

  insert into public.place_ratings (trip_id, place_key, stars, rated_at)
  values (v_trip, v_key, p_stars, p_at)
  on conflict (trip_id, place_key, user_id)
  do update set stars = excluded.stars, rated_at = excluded.rated_at;
end $$;
