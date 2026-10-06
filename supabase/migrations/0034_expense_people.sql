-- 가계부 2차 — 초대 없이 넣는 정산 인원(guest) · 「각자 냄」 · 송금 기록.
--
-- - trip_guests: 앱에 초대하지 않고 정산에만 넣는 사람(이름만). 여행 단위라 모든 비용 · 정산에 함께 보인다
-- - 결제자 · 나눌 사람은 멤버(user_id) 또는 guest(guest_id) 둘 중 하나다. 둘 다 채우거나 둘 다 비우면 거부한다
-- - 「각자 냄」(split_each): 각자 자기 몫을 냈다 — 결제자가 없고(payer 두 칸 모두 null) 정산에서 빠진다.
--   나눌 사람(expense_splits)은 그대로 둔다. 「누가 얼마를 썼는지」(개인별 지출)에는 들어가기 때문이다
-- - settlements: 「받았어요 · 보냈어요」 한 줄. 정산은 「계산한 송금 − 이미 보낸 기록」 으로 낸다.
--   비용이 나중에 바뀌어도 보낸 기록은 남고 남은 금액만 다시 계산된다. 취소는 이 줄을 지우는 것이다

create table public.trip_guests (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid not null references public.trips(id) on delete cascade,
  name       text not null constraint trip_guests_name_chk check (char_length(btrim(name)) between 1 and 20),
  created_at timestamptz not null default now()
);
create index trip_guests_trip_idx on public.trip_guests(trip_id);

alter table public.trip_guests enable row level security;
create policy "trip_guests_all" on public.trip_guests
  for all to authenticated using (public.is_trip_member(trip_id)) with check (public.is_trip_member(trip_id));

-- 결제자: 멤버거나 guest 거나, 「각자 냄」 이면 둘 다 없다
alter table public.expenses
  add column payer_guest_id uuid references public.trip_guests(id) on delete restrict,
  add column split_each boolean not null default false,
  alter column payer_id drop not null,
  add constraint expenses_payer_chk check (
    case when split_each then payer_id is null and payer_guest_id is null
         else (payer_id is null) <> (payer_guest_id is null) end
  );

-- 나눌 사람도 멤버 또는 guest. 옛 기본키가 (expense_id, user_id) 라 user_id 를 널 허용으로 바꾸려면 먼저 떼야 한다.
-- 대신 id 를 기본키로 두고, 「한 비용에 같은 사람 한 줄」 은 부분 유니크 인덱스 둘로 지킨다
alter table public.expense_splits drop constraint expense_splits_pkey;
alter table public.expense_splits
  add column id uuid primary key default gen_random_uuid(),
  add column guest_id uuid references public.trip_guests(id) on delete restrict,
  alter column user_id drop not null,
  add constraint expense_splits_person_chk check ((user_id is null) <> (guest_id is null));
create unique index expense_splits_member_idx on public.expense_splits(expense_id, user_id)
  where user_id is not null;
create unique index expense_splits_guest_idx on public.expense_splits(expense_id, guest_id)
  where guest_id is not null;

-- 보낸 돈 기록. 같은 사람끼리 여러 번 보낼 수 있어 줄마다 따로 쌓는다
create table public.settlements (
  id            uuid primary key default gen_random_uuid(),
  trip_id       uuid not null references public.trips(id) on delete cascade,
  from_user_id  uuid references public.profiles(id),
  from_guest_id uuid references public.trip_guests(id) on delete cascade,
  to_user_id    uuid references public.profiles(id),
  to_guest_id   uuid references public.trip_guests(id) on delete cascade,
  amount        numeric(14,2) not null check (amount > 0),
  settled_at    timestamptz not null default now(),
  created_by    uuid references public.profiles(id),
  constraint settlements_from_chk check ((from_user_id is null) <> (from_guest_id is null)),
  constraint settlements_to_chk check ((to_user_id is null) <> (to_guest_id is null)),
  -- 자기 자신에게 보내는 기록은 없다
  constraint settlements_self_chk check (
    from_user_id is distinct from to_user_id or from_user_id is null
  )
);
create index settlements_trip_idx on public.settlements(trip_id);

alter table public.settlements enable row level security;
create policy "settlements_all" on public.settlements
  for all to authenticated using (public.is_trip_member(trip_id)) with check (public.is_trip_member(trip_id));

-- 실시간: 일행이 넣은 인원 · 보낸 기록 · 각자 냄이 바로 보이게
alter publication supabase_realtime add table public.trip_guests, public.settlements;
alter table public.trip_guests replica identity full;
alter table public.settlements replica identity full;

-- guest 가 앱에 들어오면(초대 수락) 그 사람의 기록을 멤버 id 로 옮기고 guest 를 지운다.
-- 멤버가 이미 그 비용에 들어 있으면 guest 줄을 지운다(두 번 세지 않게)
create or replace function public.merge_trip_guest(p_guest uuid, p_user uuid)
returns void
language plpgsql security invoker set search_path = public as $$
declare
  v_trip uuid;
begin
  select trip_id into v_trip from public.trip_guests where id = p_guest for update;
  if v_trip is null then
    raise exception 'guest not found or not a member';
  end if;
  if not exists (select 1 from public.trip_members where trip_id = v_trip and user_id = p_user) then
    raise exception 'not a trip member';
  end if;

  update public.expenses set payer_id = p_user, payer_guest_id = null where payer_guest_id = p_guest;

  delete from public.expense_splits s
  where s.guest_id = p_guest
    and exists (select 1 from public.expense_splits m
                where m.expense_id = s.expense_id and m.user_id = p_user);
  update public.expense_splits set user_id = p_user, guest_id = null where guest_id = p_guest;

  update public.settlements set from_user_id = p_user, from_guest_id = null where from_guest_id = p_guest;
  update public.settlements set to_user_id = p_user, to_guest_id = null where to_guest_id = p_guest;

  delete from public.trip_guests where id = p_guest;
end $$;
