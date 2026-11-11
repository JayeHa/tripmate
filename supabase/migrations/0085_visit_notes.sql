-- 다녀온 장소의 기록 글 (#313 f-3).
--
-- 기록 창에서 다녀온 장소에 남기는 글(200자). 별점(0084)과 같이 사람마다 하나 — 지금 화면은 내 것만 보여 주지만
-- 일행 기록을 나중에 보여 줄 수 있게 사람별로 저장하고 멤버가 함께 읽는다. 일정 메모(schedule_items 의 memo)와는 따로 둔다.
--   * 일정 × 사람에 하나(item_id, user_id 가 키). 바꾸면 덮고, 글을 비우면 줄을 지운다 — 두 번 올라가도 결과가 같다(오프라인 대기열)
--   * 쓴 사람은 나뿐이다 — user_id 기본값이 나이고, 넣기 · 바꾸기 · 지우기는 내 줄만
--   * 장소 일정에만 붙는다(항공편 · 노트는 거부, 트리거). 같은 여행의 일정에만 붙고 일정을 지우면 함께 지워진다
--   * 고친 때(updated_at)는 화면이 보낸다 — 오프라인에서 저장한 시각
--   * 사진(10장 · 사진별 설명)은 다음 마이그레이션에서 따로 둔다
--
-- 권한: 여행 멤버. 익명(둘러보기)도 자기 여행이면 된다.

create table public.visit_notes (
  item_id     uuid not null,
  trip_id     uuid not null references public.trips(id) on delete cascade,
  user_id     uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  body        text not null check (char_length(btrim(body)) >= 1 and char_length(body) <= 200),
  updated_at  timestamptz not null default now(),
  primary key (item_id, user_id),
  foreign key (item_id, trip_id) references public.schedule_items (id, trip_id) on delete cascade
);
create index visit_notes_trip_idx on public.visit_notes(trip_id);

create function public.visit_note_guard()
returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  -- 보이지 않는 일정(남의 여행)은 여기서 거르지 않는다 — RLS · FK 가 거부한다
  if exists (
    select 1 from public.schedule_items where id = new.item_id and kind <> 'place'
  ) then
    raise exception 'visit_notes: 장소 일정에만 기록을 남긴다' using errcode = 'check_violation';
  end if;
  return new;
end $$;

create trigger visit_notes_guard before insert or update on public.visit_notes
  for each row execute function public.visit_note_guard();

alter table public.visit_notes enable row level security;

create policy "visit_notes_select" on public.visit_notes
  for select to authenticated
  using (public.is_trip_member(trip_id));

create policy "visit_notes_insert" on public.visit_notes
  for insert to authenticated
  with check (user_id = auth.uid() and public.is_trip_member(trip_id));

create policy "visit_notes_update" on public.visit_notes
  for update to authenticated
  using (user_id = auth.uid() and public.is_trip_member(trip_id))
  with check (user_id = auth.uid() and public.is_trip_member(trip_id));

create policy "visit_notes_delete" on public.visit_notes
  for delete to authenticated
  using (user_id = auth.uid() and public.is_trip_member(trip_id));

alter publication supabase_realtime add table public.visit_notes;
alter table public.visit_notes replica identity full;
