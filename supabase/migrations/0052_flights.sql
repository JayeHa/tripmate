-- 항공편 (#89 ①).
--
-- 항공편은 따로 저장하고(flights), 탑승일 day 끝에 그 항공편의 일정 카드(schedule_items kind 'flight', flight_id)가 하나 붙는다.
--   * 카드의 제목(「ICN 07:15 - NRT 09:40」) · 설명(「제주항공 · 7C1181」) · 출발 시각 · 예약 상태는 항공편을 따른다(sync_flight_card)
--   * 탑승일이 여행 기간 밖이면 카드가 없다. 고쳐서 밖으로 나가면 카드를 지운다(메모도 함께 — 화면이 미리 묻는다).
--     기간 안에서 날짜를 바꾸면 카드를 새 날 끝으로 옮기고 메모는 남긴다
--   * 항공편을 지우면 카드도 지운다(cascade). 카드만 지우거나 다른 날로 옮기는 것은 막는다(일정 편집 — 다음 단계)
-- 항공사 · 공항 이름 목록은 앱에 있다. DB 는 코드만 확인한다(IATA — 항공사 2자리, 공항 3자리). 항공사 이름은 목록에 없는
-- 코드를 직접 넣을 수 있어 함께 저장한다.

create table public.flights (
  id            uuid primary key default gen_random_uuid(),
  trip_id       uuid not null references public.trips(id) on delete cascade,
  airline_name  text not null check (char_length(btrim(airline_name)) between 1 and 40),
  airline_code  text not null check (airline_code ~ '^[A-Z0-9]{2}$'),
  flight_no     text not null check (flight_no ~ '^[0-9]{1,4}$'),
  dep_airport   text not null check (dep_airport ~ '^[A-Z]{3}$'),
  arr_airport   text not null check (arr_airport ~ '^[A-Z]{3}$'),
  dep_date      date not null,
  dep_time      time not null,
  arr_date      date not null,
  arr_time      time not null,
  status        text check (status in ('ok', 'wait', 'opt')),
  booking_ref   text check (char_length(booking_ref) <= 50),
  created_by    uuid default auth.uid() references public.profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- 도착이 출발보다 앞설 수 없다(시차로 도착 시각이 앞서는 것은 날짜가 같을 때도 있어 시각은 보지 않는다)
  constraint flights_dates_chk check (arr_date >= dep_date),
  -- 같은 여행의 항공편에만 카드가 붙는다(복합 FK)
  constraint flights_id_trip_key unique (id, trip_id)
);
create index flights_trip_idx on public.flights(trip_id, dep_date, dep_time);

create trigger flights_updated_at before update on public.flights
  for each row execute function public.set_updated_at();

-- 연결 카드. 항공편을 지우면 카드(와 메모)도 지운다. 항공편 하나에 타임라인 카드 하나
alter table public.schedule_items
  add column flight_id uuid,
  add constraint schedule_items_flight_fkey foreign key (flight_id, trip_id)
    references public.flights(id, trip_id) on delete cascade,
  add constraint schedule_items_flight_kind_chk check (flight_id is null or kind = 'flight');
create unique index schedule_items_flight_key on public.schedule_items(flight_id)
  where flight_id is not null and alternative_of is null;

-- ---------- RLS ----------
alter table public.flights enable row level security;

-- 멤버만. 익명도 자기 여행이면 된다(둘러보기)
create policy "flights_all" on public.flights
  for all to authenticated
  using (public.is_trip_member(trip_id))
  with check (public.is_trip_member(trip_id));

-- ---------- 카드 글자 ----------
-- 카드 제목 「ICN 07:15 - NRT 09:40」
create or replace function public.flight_card_name(f public.flights)
returns text
language sql immutable set search_path = '' as $$
  select f.dep_airport || ' ' || to_char(f.dep_time, 'HH24:MI') || ' - '
      || f.arr_airport || ' ' || to_char(f.arr_time, 'HH24:MI');
$$;

-- 카드 설명 「제주항공 · 7C1181」
create or replace function public.flight_card_description(f public.flights)
returns text
language sql immutable set search_path = '' as $$
  select f.airline_name || ' · ' || f.airline_code || f.flight_no;
$$;

-- 항공편을 고치면(어느 경로로든) 연결 카드의 제목 · 설명 · 출발 시각 · 예약 상태가 따라간다
create or replace function public.sync_flight_card()
returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  update public.schedule_items
  set name = public.flight_card_name(new),
      description = public.flight_card_description(new),
      start_time = new.dep_time,
      status = new.status
  where flight_id = new.id
    and (name, description, start_time, status) is distinct from
        (public.flight_card_name(new), public.flight_card_description(new), new.dep_time, new.status);
  return new;
end $$;

create trigger flights_sync_card after update on public.flights
  for each row execute function public.sync_flight_card();

-- ---------- 저장 ----------
-- 항공편 저장 — 넣기/고치기 → 연결 카드 맞추기. 한 트랜잭션.
--   p_flight  null 이면 새 항공편
--   p_fields  { airline_name, airline_code, flight_no, dep_airport, arr_airport, dep_date, dep_time, arr_date, arr_time,
--               status, booking_ref } — arr_date 가 비면 출발일
-- 돌려주는 값 { id, card } — card 는 이번 저장으로 카드가 'added' · 'moved' · 'removed' 됐는지, 그대로면 null(토스트에 쓴다).
--
-- 카드는 「탑승일이 여행 기간 안이면 그날에 하나」 를 맞춘다 — 없으면 그날 끝에 만들고, 다른 날에 있으면 새 날 끝으로 옮기고
-- (메모 유지), 기간 밖이면 지운다(메모도 함께 — 화면이 저장 전에 묻는다)
create or replace function public.save_flight(p_trip uuid, p_flight uuid, p_fields jsonb)
returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare
  v_dep date := (nullif(p_fields ->> 'dep_date', ''))::date;
  v_arr date;
  v_start date;
  v_end date;
  v_f public.flights;
  v_day int;
  v_card uuid;
  v_card_day int;
  v_result text;
begin
  if v_dep is null then
    raise exception 'flight departure date is required';
  end if;
  v_arr := coalesce((nullif(p_fields ->> 'arr_date', ''))::date, v_dep);

  -- 여행 기간. RLS 로 안 보이면 null → 거부. for share — 그사이 일행이 기간을 옮기면(update_trip_dates) 그 뒤에 계산한다
  select start_date, end_date into v_start, v_end from public.trips where id = p_trip for share;
  if v_start is null then
    raise exception 'trip not found or not a member';
  end if;

  if p_flight is null then
    insert into public.flights (
      trip_id, airline_name, airline_code, flight_no, dep_airport, arr_airport,
      dep_date, dep_time, arr_date, arr_time, status, booking_ref
    ) values (
      p_trip,
      btrim(p_fields ->> 'airline_name'),
      p_fields ->> 'airline_code',
      p_fields ->> 'flight_no',
      p_fields ->> 'dep_airport',
      p_fields ->> 'arr_airport',
      v_dep,
      (p_fields ->> 'dep_time')::time,
      v_arr,
      (p_fields ->> 'arr_time')::time,
      nullif(p_fields ->> 'status', ''),
      nullif(btrim(coalesce(p_fields ->> 'booking_ref', '')), '')
    )
    returning * into v_f;
  else
    update public.flights set
      airline_name = btrim(p_fields ->> 'airline_name'),
      airline_code = p_fields ->> 'airline_code',
      flight_no = p_fields ->> 'flight_no',
      dep_airport = p_fields ->> 'dep_airport',
      arr_airport = p_fields ->> 'arr_airport',
      dep_date = v_dep,
      dep_time = (p_fields ->> 'dep_time')::time,
      arr_date = v_arr,
      arr_time = (p_fields ->> 'arr_time')::time,
      status = nullif(p_fields ->> 'status', ''),
      booking_ref = nullif(btrim(coalesce(p_fields ->> 'booking_ref', '')), '')
    where id = p_flight and trip_id = p_trip
    returning * into v_f;
    if v_f.id is null then
      raise exception 'flight not found or not a member';
    end if;
  end if;

  -- ---------- 연결 카드 ----------
  v_day := v_dep - v_start;
  select id, day_index into v_card, v_card_day
  from public.schedule_items where flight_id = v_f.id and alternative_of is null
  for update;

  if v_dep < v_start or v_dep > v_end then
    if v_card is not null then
      delete from public.schedule_items where id = v_card;
      v_result := 'removed';
    end if;
  elsif v_card is null then
    insert into public.schedule_items (
      trip_id, day_index, position, kind, flight_id, name, description, start_time, status, created_by
    ) values (
      p_trip, v_day,
      (select coalesce(max(position) + 1, 0) from public.schedule_items
        where trip_id = p_trip and day_index = v_day),
      'flight', v_f.id, public.flight_card_name(v_f), public.flight_card_description(v_f),
      v_f.dep_time, v_f.status, auth.uid()
    );
    v_result := 'added';
  elsif v_card_day <> v_day then
    update public.schedule_items set
      day_index = v_day,
      position = (select coalesce(max(position) + 1, 0) from public.schedule_items
        where trip_id = p_trip and day_index = v_day)
    where id = v_card;
    v_result := 'moved';
  end if;

  return jsonb_build_object('id', v_f.id, 'card', v_result);
end $$;
revoke all on function public.save_flight(uuid, uuid, jsonb) from public;
grant execute on function public.save_flight(uuid, uuid, jsonb) to authenticated;

-- 여행 기간 바꾸기 — 항공편도 출발일이 옮겨진 만큼 함께 옮긴다(0046 + 항공편). 카드는 day_index 를 유지하므로(날짜가 함께
-- 옮겨진다) 항공편 날짜도 같이 가야 카드와 어긋나지 않는다
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

  update public.flights
  set dep_date = dep_date + (p_start - v_old_start),
      arr_date = arr_date + (p_start - v_old_start)
  where trip_id = p_trip_id;

  delete from public.day_routes where trip_id = p_trip_id and day_index >= v_days;
end $$;

-- 실시간: 일행이 넣은 항공편이 바로 보이게
alter publication supabase_realtime add table public.flights;
alter table public.flights replica identity full;
