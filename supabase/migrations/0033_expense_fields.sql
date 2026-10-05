-- 가계부 기반 — 지출에 항목명 · 결제수단 · 지출별 환율 · 합계 포함 여부 · 결제 상태를 더하고, 「여행준비」 를 날짜 없음으로 둔다.
--
-- - name: 항목명(1–100자). 지금까지는 메모를 제목으로 썼다. 옛 행은 메모(없으면 「지출」)로 채운다
-- - category: 항공(flight)을 더해 7개. 옛 키는 그대로 둔다(lodging 숙소 · transport 교통 · activity 관광 · food 식비 · shopping 쇼핑 · other 기타)
-- - spent_on: null 을 허용한다. null = 여행준비(출발 전에 쓴 돈 — 숙소 · 항공 · eSIM). 실제 결제한 날짜는 적지 않는다
-- - payment_method: 현금(cash) · 카드(card) · 교통카드(transit)
-- - rate: 이 지출에만 쓰는 환율 — 기준 화폐 / 지출 통화 1단위(100엔 = 888.3원이면 8.883). null 이면 여행의 기본 환율(trips.exchange_rates)
-- - counted: 합계 · 통계 · 정산에 넣을지. false 면 목록에는 보이지만 어디에도 더하지 않는다
-- - paid · due_date: 결제 완료 / 결제 예정(+ 예정일). 결제 예정도 합계 · 정산에 들어간다(counted 와 별개)

alter table public.expenses
  add column name text,
  add column payment_method text not null default 'cash'
    constraint expenses_payment_method_chk check (payment_method in ('cash', 'card', 'transit')),
  add column rate numeric(18, 8)
    constraint expenses_rate_chk check (rate > 0),
  add column counted boolean not null default true,
  add column paid boolean not null default true,
  add column due_date date,
  -- 예정일은 결제 예정일 때만 있다. 결제 완료로 바꾸면 비운다
  add constraint expenses_due_date_chk check (not paid or due_date is null);

update public.expenses
set name = coalesce(nullif(left(btrim(memo), 100), ''), '지출');

alter table public.expenses
  alter column name set not null,
  add constraint expenses_name_chk check (char_length(btrim(name)) between 1 and 100),
  alter column spent_on drop not null;

alter table public.expenses drop constraint expenses_category_check;
alter table public.expenses add constraint expenses_category_check
  check (category in ('lodging', 'flight', 'transport', 'activity', 'food', 'shopping', 'other'));

-- 여행 날짜를 옮길 때 여행준비(spent_on null) 지출은 그대로 둔다.
-- least() 는 null 을 건너뛰어서, 거르지 않으면 여행준비 지출이 모두 새 도착일로 바뀐다. 그 밖은 0009 와 같다.
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

  -- 옮기기 전 출발일. 행을 잠가서 읽는다: 두 멤버가 동시에 고치면 뒤 사람이 앞 사람의 커밋을
  -- 기다린 뒤 바뀐 출발일을 읽는다. 잠그지 않으면 둘 다 옛 출발일 기준으로 지출을 옮겨 두 번 밀린다.
  -- RLS 로 안 보이면 null 이고, 아래 update 가 0행이라 같은 예외로 끝난다
  select start_date into v_old_start from public.trips where id = p_trip_id for update;

  update public.trips set start_date = p_start, end_date = p_end where id = p_trip_id;
  if not found then
    raise exception 'trip not found or not a member';
  end if;

  -- 새 마지막 날에 이미 있는 일정 뒤에 붙인다
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

  -- 지출: 출발일이 옮겨진 만큼 함께 옮기고, 새 도착일을 넘는 것은 도착일로 모은다. 여행준비(날짜 없음)는 그대로
  update public.expenses
  set spent_on = least(spent_on + (p_start - v_old_start), p_end)
  where trip_id = p_trip_id and spent_on is not null;

  -- 사라진 날의 경로 캐시는 지운다. 마지막 날은 일정이 바뀌어 해시가 달라지므로 다시 계산된다.
  delete from public.day_routes where trip_id = p_trip_id and day_index >= v_days;
end $$;

-- 대체 장소 「바꾸기」 — 지출의 합계 포함 여부도 함께 바꾼다(2026-10-05 사용자 결정, #92).
-- 지출 연결(expenses.schedule_item_id)은 줄에 붙어 장소를 따라간다. 그래서 대체 장소가 된 원래 일정의 지출은
-- 쓰지 않은 돈이 되어 합계에서 빼고, 타임라인에 올라온 일정의 지출은 다시 넣는다(다시 바꾸면 원래대로).
-- 그 뒤에는 사용자가 지출마다 바꿀 수 있다. 그 밖은 0025 와 같다.
create or replace function public.swap_alternative(p_alt uuid)
returns void
language plpgsql security invoker set search_path = '' as $$
declare
  v_main public.schedule_items;
  v_alt public.schedule_items;
begin
  select * into v_alt from public.schedule_items where id = p_alt;
  if v_alt.id is null or v_alt.alternative_of is null then
    raise exception 'not an alternative';
  end if;
  -- 원래 일정 줄을 잠그고 대체 장소를 다시 읽는다. 같은 일정의 다른 대체 장소를 동시에 바꾸면 뒤에 온 쪽은 여기서 기다렸다가
  -- 이미 바뀐 것을 보고 거부된다(잠그지 않으면 두 대체 장소가 같은 자리에 함께 올라간다)
  select * into v_main from public.schedule_items where id = v_alt.alternative_of for update;
  select * into v_alt from public.schedule_items where id = p_alt for update;
  if v_alt.alternative_of is distinct from v_main.id then
    raise exception 'alternative already swapped';
  end if;

  update public.moves set from_item_id = v_alt.id where from_item_id = v_main.id;
  update public.moves set to_item_id = v_alt.id where to_item_id = v_main.id;

  update public.schedule_items set
    alternative_of = null, day_index = v_main.day_index, position = v_main.position, start_time = v_main.start_time
  where id = v_alt.id;
  update public.schedule_items set alternative_of = v_alt.id
  where alternative_of = v_main.id;
  update public.schedule_items set alternative_of = v_alt.id, start_time = null, position = v_alt.position
  where id = v_main.id;
  if not found then
    raise exception 'item not found or not a member';
  end if;

  update public.expenses set counted = false where schedule_item_id = v_main.id and counted;
  update public.expenses set counted = true where schedule_item_id = v_alt.id and not counted;
end $$;
