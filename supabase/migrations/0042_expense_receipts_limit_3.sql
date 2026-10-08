-- 영수증을 한 지출에 3장까지로 줄인다(0041 은 10장, 2026-10-08 사용자 결정).
-- 화면도 같은 수(RECEIPT_MAX_COUNT)로 막는다. 이미 4장 이상 붙은 지출은 그대로 두고, 그 지출에 더 붙이는 것만 막는다
-- (개발 데이터라 정리하지 않는다).
create or replace function public.expense_receipts_limit()
returns trigger
language plpgsql set search_path = public as $$
begin
  if (select count(*) from public.expense_receipts where expense_id = new.expense_id) >= 3 then
    raise exception 'too many receipts for one expense';
  end if;
  return new;
end $$;
