-- 정산 인원이 그 비용 · 송금 기록과 **같은 여행**이라는 불변식을 FK 로 고정한다(0012 의 moves 와 같은 방식).
-- 0034 는 `trip_guests(id)` 만 참조해서, 두 여행에 모두 있는 멤버가 다른 여행의 인원 id 를 넣을 수 있었다.
-- RLS 는 행 자신의 trip_id 만 보므로 막지 못한다.
--
-- expense_splits 에는 trip_id 가 없어 칸을 더하고 트리거로 채운다(비용에서 가져온다). 그러면 두 복합 FK 로
-- 「이 줄 = 그 비용의 여행」 · 「인원 = 같은 여행」 이 동시에 지켜진다.

alter table public.trip_guests add constraint trip_guests_id_trip_key unique (id, trip_id);
alter table public.expenses add constraint expenses_id_trip_key unique (id, trip_id);

alter table public.expenses
  drop constraint expenses_payer_guest_id_fkey,
  add constraint expenses_payer_guest_fkey foreign key (payer_guest_id, trip_id)
    references public.trip_guests (id, trip_id) on delete restrict;

-- 나눔 줄의 여행. 비용에서 가져오므로 클라이언트는 넣지 않는다
alter table public.expense_splits add column trip_id uuid;
update public.expense_splits s set trip_id = e.trip_id from public.expenses e where e.id = s.expense_id;
alter table public.expense_splits alter column trip_id set not null;

create or replace function public.set_expense_split_trip()
returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  select trip_id into new.trip_id from public.expenses where id = new.expense_id;
  return new;
end $$;

create trigger expense_splits_trip before insert or update of expense_id on public.expense_splits
  for each row execute function public.set_expense_split_trip();

alter table public.expense_splits
  drop constraint expense_splits_expense_id_fkey,
  add constraint expense_splits_expense_fkey foreign key (expense_id, trip_id)
    references public.expenses (id, trip_id) on delete cascade,
  drop constraint expense_splits_guest_id_fkey,
  add constraint expense_splits_guest_fkey foreign key (guest_id, trip_id)
    references public.trip_guests (id, trip_id) on delete restrict;

alter table public.settlements
  drop constraint settlements_from_guest_id_fkey,
  drop constraint settlements_to_guest_id_fkey,
  add constraint settlements_from_guest_fkey foreign key (from_guest_id, trip_id)
    references public.trip_guests (id, trip_id) on delete restrict,
  add constraint settlements_to_guest_fkey foreign key (to_guest_id, trip_id)
    references public.trip_guests (id, trip_id) on delete restrict;
