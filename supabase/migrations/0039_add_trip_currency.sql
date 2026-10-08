-- 여행에 통화를 더한다 — 비용 입력의 「다른 통화 추가」(⑪-b).
--
-- 여행 환율(trips.exchange_rates)은 jsonb 하나라, 화면이 읽은 값에 더해 통째로 다시 쓰면 두 사람이 동시에 다른 통화를
-- 더할 때 앞 사람의 통화가 사라진다. 그래서 DB 에서 그 키 하나만 더한다. 이미 있으면 그대로 둔다(일행이 고친 환율을 덮지 않는다).
-- 기준 화폐는 더하지 않는다(기준 화폐는 환율이 없다).
-- security invoker — 여행을 고칠 수 있는 사람(멤버, RLS)만 된다.
create or replace function public.add_trip_currency(
  p_trip_id uuid,
  p_code text,
  p_unit numeric,
  p_value numeric
)
returns void
language plpgsql security invoker set search_path = public as $$
declare
  v_home text;
begin
  if p_code !~ '^[A-Z]{3}$' then
    raise exception 'currency code must be 3 capital letters';
  end if;
  if p_unit is null or p_unit <= 0 or p_value is null or p_value <= 0 then
    raise exception 'rate must be positive';
  end if;

  select home_currency into v_home from public.trips where id = p_trip_id for update;
  if v_home is null then
    raise exception 'trip not found or not a member';
  end if;
  if v_home = p_code then
    raise exception 'home currency has no rate';
  end if;

  update public.trips
  set exchange_rates = jsonb_build_object(p_code, jsonb_build_object('unit', p_unit, 'value', p_value))
    || exchange_rates
  where id = p_trip_id and not exchange_rates ? p_code;
end $$;
