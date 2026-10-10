-- 숙소 = 장소 + 숙소 예약 (#88 ①).
--
-- 이름 · 주소 · 좌표 · 구글맵은 장소(places, category 'stay')에 두고, 숙소(stays)는 예약 정보(아이콘 · 예약 상태 · 숙박 날짜 ·
-- 체크인/체크아웃 시각 · 메모 · 링크)만 갖는다. 묵는 날마다 그 장소의 일정 카드(schedule_items.stay_id)가 하나씩 생기고,
-- 그 뒤로는 일반 일정 카드다(순서 · 삭제 · 날짜 이동 모두 가능).
--   * 이름 · 주소는 카드가 place_id 로 읽어 저절로 따라간다
--   * 아이콘 · 예약 상태는 stays → schedule_items 로 복사한다(sync_stay_cards). 숙소를 지우며 카드를 남기면 그 모습 그대로 일반 카드가 된다
-- 숙박 날짜가 여행 기간 밖으로 나가도 된다 — 카드는 여행 기간 안의 날에만 만든다(0046 save_stay).

create table public.stays (
  id              uuid primary key default gen_random_uuid(),
  trip_id         uuid not null references public.trips(id) on delete cascade,
  place_id        uuid not null references public.places(id) on delete restrict,
  emoji           text,
  status          text check (status in ('ok', 'wait', 'opt')),
  check_in_date   date not null,
  check_out_date  date not null,
  check_in_time   time,
  check_out_time  time,
  memo            text check (char_length(memo) <= 2000),
  links           jsonb not null default '[]'::jsonb check (jsonb_typeof(links) = 'array'),
  created_by      uuid default auth.uid() references public.profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- 0박은 없다(체크아웃은 체크인 뒤)
  constraint stays_dates_chk check (check_out_date > check_in_date),
  -- 같은 여행의 숙소에만 카드가 붙는다(복합 FK)
  constraint stays_id_trip_key unique (id, trip_id)
);
create index stays_trip_idx on public.stays(trip_id, check_in_date);
create index stays_place_idx on public.stays(place_id);

create trigger stays_updated_at before update on public.stays
  for each row execute function public.set_updated_at();

-- 연결 카드. 숙소를 지우면 연결만 풀린다(set null (stay_id) — 복합 FK 라 열을 적어야 trip_id 가 null 이 되지 않는다).
-- 대체 장소 줄(alternative_of)에도 남을 수 있지만, 세기 · 만들기 · 정리는 타임라인 줄만 본다
alter table public.schedule_items
  add column stay_id uuid,
  add constraint schedule_items_stay_fkey foreign key (stay_id, trip_id)
    references public.stays(id, trip_id) on delete set null (stay_id),
  add constraint schedule_items_stay_kind_chk check (stay_id is null or kind = 'place');
create index schedule_items_stay_idx on public.schedule_items(stay_id);

-- ---------- RLS ----------
alter table public.stays enable row level security;

-- 멤버만, 붙일 수 있는 장소(내 것 · 이 여행이 쓰는 것)만. 익명도 자기 여행이면 된다
create policy "stays_all" on public.stays
  for all to authenticated
  using (public.is_trip_member(trip_id))
  with check (public.is_trip_member(trip_id) and public.can_attach_place(place_id, trip_id));

-- 이 여행의 숙소가 쓰는 장소도 붙일 수 있다 — 연결 카드를 다 지운 뒤에도 일행이 그 숙소를 다시 담을 수 있게
create or replace function public.can_attach_place(p_place uuid, p_trip uuid)
returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.places p where p.id = p_place and p.created_by = auth.uid())
      or exists (select 1 from public.schedule_items si where si.place_id = p_place and si.trip_id = p_trip)
      or exists (select 1 from public.stays s where s.place_id = p_place and s.trip_id = p_trip);
$$;

-- 숙소가 쓰는 장소는 그 여행 멤버가 읽는다 — 연결 카드가 0장이어도 숙소 목록에 이름이 보이게
drop policy "places_select" on public.places;
create policy "places_select" on public.places
  for select to authenticated using (
    created_by = auth.uid()
    or exists (
      select 1 from public.schedule_items si
      where si.place_id = places.id and public.is_trip_member(si.trip_id)
    )
    or exists (
      select 1 from public.stays s
      where s.place_id = places.id and public.is_trip_member(s.trip_id)
    )
  );

-- ---------- 숙소 → 연결 카드 반영 ----------
-- 장소 · 아이콘 · 예약 상태를 바꾸면(어느 경로로든 — save_stay, 상세의 「상태 바로 바꾸기」) 연결된 타임라인 · 대체 장소 줄이 따라간다
create or replace function public.sync_stay_cards()
returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  update public.schedule_items
  set place_id = new.place_id, emoji = new.emoji, status = new.status
  where stay_id = new.id
    and (place_id, emoji, status) is distinct from (new.place_id, new.emoji, new.status);
  return new;
end $$;

create trigger stays_sync_cards after update of place_id, emoji, status on public.stays
  for each row execute function public.sync_stay_cards();

-- 실시간: 일행이 넣은 숙소가 바로 보이게
alter publication supabase_realtime add table public.stays;
alter table public.stays replica identity full;
