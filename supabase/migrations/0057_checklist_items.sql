-- 노트 · 체크리스트 (#16 ①).
--
-- 여행의 체크리스트 항목. 일행이 함께 보고 고친다(여행 멤버 누구나).
--   * 상태: 해야 할 것(todo) · 기타(etc) · 완료(done)
--   * 마감일은 날짜만(시각 없음), 없으면 null
--   * 메모 · 링크([{title, url}])
--   * 홈에 고정: 고정한 사람(pinned_by). 일행 모두의 홈에 보이고 누구나 푼다 — 홈 화면은 #17
--   * 일정 · 항공편 · 숙소 연결은 다음 단계(②)에서 따로 둔다

create table public.checklist_items (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references public.trips(id) on delete cascade,
  status      text not null default 'todo' check (status in ('todo', 'etc', 'done')),
  title       text not null check (char_length(btrim(title)) between 1 and 100),
  due_date    date,
  body        text not null default '' check (char_length(body) <= 2000),
  links       jsonb not null default '[]'::jsonb check (jsonb_typeof(links) = 'array'),
  pinned_by   uuid references public.profiles(id) on delete set null,
  created_by  uuid default auth.uid() references public.profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- 연결(②)이 같은 여행의 항목에만 붙게(복합 FK)
  constraint checklist_items_id_trip_key unique (id, trip_id)
);
create index checklist_items_trip_idx on public.checklist_items(trip_id);

create trigger checklist_items_updated_at before update on public.checklist_items
  for each row execute function public.set_updated_at();

-- ---------- RLS ----------
alter table public.checklist_items enable row level security;

-- 멤버만. 익명도 자기 여행이면 된다(둘러보기)
create policy "checklist_items_all" on public.checklist_items
  for all to authenticated
  using (public.is_trip_member(trip_id))
  with check (public.is_trip_member(trip_id));

-- 실시간: 일행이 넣고 체크한 항목이 바로 보이게
alter publication supabase_realtime add table public.checklist_items;
alter table public.checklist_items replica identity full;
