-- 여행 홈 「교통」 탭 (#17 ⑥).
--
-- 여행 전에 적어 두는 1인 예상 교통비. 일행이 함께 보고 고친다(여행 멤버 누구나).
--   * 날짜 줄: 그날(day_index)의 1인 금액 · 경로 메모. 날짜마다 하나(unique). 비우면 줄을 지운다
--   * 날짜 밖 줄: 공항 왕복 · 교통 패스처럼 하루에 묶이지 않는 것. 이름이 있다(날짜 줄은 이름이 없다)
--   * 금액은 그 줄의 통화로(여행 통화 중 하나). 합계는 화면이 통화별로 더한다
--   * 날짜는 일정처럼 day_index 기준 — 출발일을 옮겨도 그 차례에 남고, 기간보다 긴 줄은 보이지 않을 뿐 지우지 않는다
-- 여행에는 교통카드 · 패스 메모 한 칸(trips.transport_note)을 둔다. 여행 칸이라 trips_update_member 가 그대로 걸린다.

create table public.transport_fares (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references public.trips(id) on delete cascade,
  day_index   integer check (day_index >= 0),
  title       text check (char_length(btrim(title)) between 1 and 30),
  amount      numeric(12, 2) check (amount >= 0 and amount < 10000000000),
  currency    text not null check (currency ~ '^[A-Z]{3}$'),
  memo        text check (char_length(memo) <= 200),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- 날짜마다 한 줄. 날짜 밖 줄(null)은 여러 개 — unique 는 null 끼리 겹쳐도 된다
  constraint transport_fares_day_key unique (trip_id, day_index),
  -- 날짜 줄은 이름이 없고, 날짜 밖 줄은 이름이 있다
  constraint transport_fares_kind_chk check ((day_index is null) = (title is not null)),
  -- 날짜 줄은 금액이나 메모 중 하나는 있다 — 둘 다 비면 기록이 아니라 지우기다
  constraint transport_fares_filled_chk check (day_index is null or amount is not null or memo is not null)
);
create index transport_fares_trip_idx on public.transport_fares(trip_id);

create trigger transport_fares_updated_at before update on public.transport_fares
  for each row execute function public.set_updated_at();

alter table public.transport_fares enable row level security;

-- 멤버만. 익명도 자기 여행이면 된다(둘러보기)
create policy "transport_fares_all" on public.transport_fares
  for all to authenticated
  using (public.is_trip_member(trip_id))
  with check (public.is_trip_member(trip_id));

alter publication supabase_realtime add table public.transport_fares;
alter table public.transport_fares replica identity full;

-- 교통카드 · 패스 메모(「아이폰의 이코카를 그대로 씁니다」). 비우면 null
alter table public.trips add column transport_note text
  check (char_length(transport_note) <= 500);
