-- 다녀감 표시를 일행과 함께 (#313 a-1).
--
-- 일정마다 「다녀왔어요」 · 「패스」(일정엔 넣었지만 가지 않았다) 중 하나. 지금까지는 기기마다 따로 두었다(localStorage tm-visit-marks).
-- 이제 한 사람이 누르면 일행도 본다 — 홈 「다음 장소」 · 일정의 회색 · 상세 「방문」 · 기록 모드가 같은 표시를 쓴다(사용자 결정 2026-11-06).
--   * 일정 하나에 표시 하나(item_id 가 키). 바꾸면 덮고, 지우면 줄을 지운다 — 두 번 올라가도 결과가 같다(오프라인 대기열)
--   * 같은 여행의 일정에만 붙고, 일정을 지우면 함께 지워진다
--   * 누른 사람(marked_by)은 넣을 때 · 바꿀 때 auth.uid() 로 채운다(남의 이름으로 누르지 못한다). 누른 때(marked_at)는 화면이 보낸다 — 오프라인에서 누른 시각
--
-- 권한: 여행 멤버 누구나. 익명(둘러보기)도 자기 여행이면 된다.

create table public.schedule_visits (
  item_id    uuid primary key,
  trip_id    uuid not null references public.trips(id) on delete cascade,
  mark       text not null check (mark in ('visited', 'skipped')),
  marked_by  uuid references public.profiles(id) on delete set null,
  marked_at  timestamptz not null default now(),
  foreign key (item_id, trip_id) references public.schedule_items (id, trip_id) on delete cascade
);
create index schedule_visits_trip_idx on public.schedule_visits(trip_id);

create function public.set_visit_marker()
returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  new.marked_by := auth.uid();
  return new;
end $$;

create trigger schedule_visits_marker before insert or update on public.schedule_visits
  for each row execute function public.set_visit_marker();

alter table public.schedule_visits enable row level security;

create policy "schedule_visits_all" on public.schedule_visits
  for all to authenticated
  using (public.is_trip_member(trip_id))
  with check (public.is_trip_member(trip_id));

alter publication supabase_realtime add table public.schedule_visits;
alter table public.schedule_visits replica identity full;
