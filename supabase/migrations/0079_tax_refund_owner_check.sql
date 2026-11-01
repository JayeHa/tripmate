-- 택스 리펀 「누구 것」 검사를 바꿀 때만 (#303 리뷰).
--
-- 0078 은 정책 with check 로 owner_id 가 지금 멤버인지 봤다. with check 는 UPDATE 마다 새 행 전체를 다시 보므로,
-- 「누구 것」 멤버가 여행을 나가면(프로필은 남아 owner_id 가 비지 않는다) 그 행의 모든 저장 — 「세관 확인했어요」 까지 — 이 막혔다.
-- 넣을 때와 owner_id 를 바꿀 때만 멤버인지 확인한다. 나간 사람이 그대로인 저장은 지나가고, 나간 사람을 새로 고르는 것만 막힌다.
drop policy "tax_refunds_all" on public.tax_refunds;
create policy "tax_refunds_all" on public.tax_refunds
  for all to authenticated
  using (public.is_trip_member(trip_id))
  with check (public.is_trip_member(trip_id));

-- invoker — 멤버는 같은 여행의 멤버 줄을 읽을 수 있다(members_select)
create function public.check_tax_refund_owner()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.owner_id is not null
     and (tg_op = 'INSERT' or new.owner_id is distinct from old.owner_id)
     and not exists (
       select 1 from public.trip_members m
       where m.trip_id = new.trip_id and m.user_id = new.owner_id
     ) then
    raise exception 'refund owner is not a trip member' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger tax_refunds_owner_check before insert or update on public.tax_refunds
  for each row execute function public.check_tax_refund_owner();
