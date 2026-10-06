-- 0034 의 세 가지를 고친다.
--
-- 1) 송금 기록의 정산 인원 FK 가 cascade 라, 송금 기록만 남은 인원을 빼면 그 기록이 조용히 지워졌다.
--    비용 쪽(restrict)과 맞춰 「쓰고 있으면 못 뺀다」 로 바꾼다
-- 2) merge_trip_guest 가 멤버 줄이 이미 있는 비용에서 인원의 나눔 줄을 그냥 지워 그 몫이 사라졌다.
--    같은 사람 둘이 하나가 되는 것이므로 몫을 더한다
-- 3) 인원 ↔ 멤버 사이 송금 기록이 있으면 합칠 때 양쪽이 같은 사람이 되어 settlements_self_chk 에 걸렸다.
--    한 사람이 되면 그 송금은 뜻이 없으므로 옮기기 전에 지운다

alter table public.settlements
  drop constraint settlements_from_guest_id_fkey,
  drop constraint settlements_to_guest_id_fkey,
  add constraint settlements_from_guest_id_fkey
    foreign key (from_guest_id) references public.trip_guests(id) on delete restrict,
  add constraint settlements_to_guest_id_fkey
    foreign key (to_guest_id) references public.trip_guests(id) on delete restrict;

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

  -- 같은 비용에 멤버 줄이 이미 있으면 인원의 몫을 그 줄에 더하고 인원 줄을 지운다(두 줄이 한 사람이 된다)
  update public.expense_splits m
  set share = m.share + g.share
  from public.expense_splits g
  where g.guest_id = p_guest and m.expense_id = g.expense_id and m.user_id = p_user;

  delete from public.expense_splits s
  where s.guest_id = p_guest
    and exists (select 1 from public.expense_splits m
                where m.expense_id = s.expense_id and m.user_id = p_user);
  update public.expense_splits set user_id = p_user, guest_id = null where guest_id = p_guest;

  -- 인원 ↔ 그 멤버 사이의 송금은 한 사람이 되면 뜻이 없다(자기 자신에게 보낸 기록이 된다)
  delete from public.settlements
  where (from_guest_id = p_guest and to_user_id = p_user)
     or (to_guest_id = p_guest and from_user_id = p_user);

  update public.settlements set from_user_id = p_user, from_guest_id = null where from_guest_id = p_guest;
  update public.settlements set to_user_id = p_user, to_guest_id = null where to_guest_id = p_guest;

  delete from public.trip_guests where id = p_guest;
end $$;
