-- 여행에 통화 더하기가 「화면이 알던 기준 화폐」 를 받는다(0039 고침).
--
-- 처음 환율은 화면이 아는 기준 화폐(캐시일 수 있다)로 계산한다. 그사이 다른 멤버가 기준 화폐를 바꿨으면
-- 옛 기준의 값이 새 기준의 환율로 들어간다(KRW 기준 「100엔 = 920」 이 USD 기준 「100엔 = 920달러」 로). 그래서
-- p_home 이 지금 기준 화폐와 다르면 거부한다 — 0038(change_home_currency)과 같은 문구라 화면 안내를 함께 쓴다.
--
-- 보장 범위: 이 함수끼리는 동시에 다른 통화를 더해도 앞 사람의 통화가 사라지지 않는다(키 하나만 더한다).
-- 여행 설정 저장(trips 직접 update)과 기준 화폐 바꾸기(change_home_currency)는 화면이 가진 환율로 통째로 쓰므로,
-- 그사이 더한 통화를 덮어쓸 수 있다(#154).
drop function public.add_trip_currency(uuid, text, numeric, numeric);

create or replace function public.add_trip_currency(
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
  if v_home <> p_home then
    raise exception 'home currency changed by someone else';
  end if;
  if v_home = p_code then
    raise exception 'home currency has no rate';
  end if;

  update public.trips
  set exchange_rates = jsonb_build_object(p_code, jsonb_build_object('unit', p_unit, 'value', p_value))
    || exchange_rates
  where id = p_trip_id and not exchange_rates ? p_code;
end $$;
