-- 다녀온 장소의 내 별점 (#313 f-3).
--
-- 기록 모드에서 다녀온 장소 카드에 1~5점을 매긴다. 사람마다 하나 — 지금 화면은 내 것만 보여 주지만
-- 일행 별점 · 평균을 나중에 보여 줄 수 있게 사람별로 저장하고 멤버가 함께 읽는다(사용자 결정 2026-11-10).
--   * 일정 × 사람에 하나(item_id, user_id 가 키). 바꾸면 덮고, 0점(지우기)은 줄을 지운다 — 두 번 올라가도 결과가 같다(오프라인 대기열)
--   * 매긴 사람은 나뿐이다 — user_id 기본값이 나이고, 넣기 · 바꾸기 · 지우기는 내 줄만
--   * 장소 일정에만 붙는다(항공편 · 노트는 거부, 트리거). 같은 여행의 일정에만 붙고 일정을 지우면 함께 지워진다
--   * 매긴 때(rated_at)는 화면이 보낸다 — 오프라인에서 누른 시각
--
-- 권한: 여행 멤버. 익명(둘러보기)도 자기 여행이면 된다.

create table public.place_ratings (
  item_id   uuid not null,
  trip_id   uuid not null references public.trips(id) on delete cascade,
  user_id   uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  stars     smallint not null check (stars between 1 and 5),
  rated_at  timestamptz not null default now(),
  primary key (item_id, user_id),
  foreign key (item_id, trip_id) references public.schedule_items (id, trip_id) on delete cascade
);
create index place_ratings_trip_idx on public.place_ratings(trip_id);

create function public.place_rating_guard()
returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  -- 보이지 않는 일정(남의 여행)은 여기서 거르지 않는다 — RLS · FK 가 거부한다
  if exists (
    select 1 from public.schedule_items where id = new.item_id and kind <> 'place'
  ) then
    raise exception 'place_ratings: 장소 일정에만 별점을 매긴다' using errcode = 'check_violation';
  end if;
  return new;
end $$;

create trigger place_ratings_guard before insert or update on public.place_ratings
  for each row execute function public.place_rating_guard();

alter table public.place_ratings enable row level security;

create policy "place_ratings_select" on public.place_ratings
  for select to authenticated
  using (public.is_trip_member(trip_id));

create policy "place_ratings_insert" on public.place_ratings
  for insert to authenticated
  with check (user_id = auth.uid() and public.is_trip_member(trip_id));

create policy "place_ratings_update" on public.place_ratings
  for update to authenticated
  using (user_id = auth.uid() and public.is_trip_member(trip_id))
  with check (user_id = auth.uid() and public.is_trip_member(trip_id));

create policy "place_ratings_delete" on public.place_ratings
  for delete to authenticated
  using (user_id = auth.uid() and public.is_trip_member(trip_id));

alter publication supabase_realtime add table public.place_ratings;
alter table public.place_ratings replica identity full;
