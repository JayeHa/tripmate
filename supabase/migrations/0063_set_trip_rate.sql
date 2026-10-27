-- 여행 환율 하나만 바꾼다 — 여행 홈 환율 계산기의 「여행 환율 바꾸기」.
--
-- 여행 설정 저장(trips 직접 update)은 화면이 가진 환율로 통째로 쓰지만, 이 함수는 그 통화 키 하나만 바꾼다.
-- 그래서 그사이 다른 멤버가 더하거나 바꾼 다른 통화의 환율을 덮지 않는다(add_trip_currency 와 같은 보장).
-- 환율은 화면이 아는 기준 화폐로 적은 값이라, p_home 이 지금 기준 화폐와 다르면 거부한다(같은 문구 — 화면 안내를 함께 쓴다).
-- 여행 환율에 없는 통화는 거부한다(더하기는 add_trip_currency). 환율을 따로 적지 않은 지출의 기준 화폐 환산이 함께 바뀐다.
create or replace function public.set_trip_rate(
  p_trip_id uuid,
  p_home text,
  p_code text,
  p_unit numeric,
  p_value numeric
)
returns void
language plpgsql security invoker set search_path = public as $$
declare
  v_home text;
  v_rates jsonb;
begin
  if p_unit is null or p_unit <= 0 or p_value is null or p_value <= 0 then
    raise exception 'rate must be positive';
  end if;

  select home_currency, exchange_rates into v_home, v_rates
  from public.trips where id = p_trip_id for update;
  if v_home is null then
    raise exception 'trip not found or not a member';
  end if;
  if v_home <> p_home then
    raise exception 'home currency changed by someone else';
  end if;
  if not coalesce(v_rates, '{}'::jsonb) ? p_code then
    raise exception 'currency not in trip';
  end if;

  update public.trips
  set exchange_rates = jsonb_set(
    exchange_rates,
    array[p_code],
    jsonb_build_object('unit', p_unit, 'value', p_value)
  )
  where id = p_trip_id;
end $$;
