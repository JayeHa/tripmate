-- 여행 설정 「환율」 저장 — 화면이 고친 통화만 바꾸거나 더하고, 뺀 통화만 지운다(#19 ②).
-- 예전 설정 저장은 화면이 읽은 환율로 통째로 써서, 그사이 일행이 비용 입력에서 더한 통화를 지웠다(#154).
-- p_home = 화면이 알던 기준 화폐 — 그사이 다른 사람이 바꿨으면 거부한다(옛 기준의 값이 들어가지 않게)
create function public.save_trip_rates(
  p_trip_id uuid,
  p_home text,
  p_set jsonb,
  p_remove text[]
)
returns void
language plpgsql security invoker set search_path = public as $$
declare
  v_home text;
  v_code text;
  v_rate jsonb;
  v_set jsonb := '{}'::jsonb;
begin
  if jsonb_typeof(p_set) is distinct from 'object' then
    raise exception 'rates must be an object';
  end if;

  -- 통화마다 확인하고 unit · value 두 칸만 남긴다
  for v_code, v_rate in select key, value from jsonb_each(p_set) loop
    if v_code !~ '^[A-Z]{3}$' then
      raise exception 'currency code must be 3 capital letters';
    end if;
    if jsonb_typeof(v_rate -> 'unit') is distinct from 'number'
      or jsonb_typeof(v_rate -> 'value') is distinct from 'number'
      or (v_rate ->> 'unit')::numeric <= 0
      or (v_rate ->> 'value')::numeric <= 0 then
      raise exception 'rate must be positive';
    end if;
    v_set := v_set || jsonb_build_object(
      v_code,
      jsonb_build_object('unit', (v_rate ->> 'unit')::numeric, 'value', (v_rate ->> 'value')::numeric)
    );
  end loop;

  select home_currency into v_home from public.trips where id = p_trip_id for update;
  if v_home is null then
    raise exception 'trip not found or not a member';
  end if;
  if v_home <> p_home then
    raise exception 'home currency changed by someone else';
  end if;
  if v_set ? v_home then
    raise exception 'home currency has no rate';
  end if;

  update public.trips
  set exchange_rates = (exchange_rates - coalesce(p_remove, '{}'::text[])) || v_set
  where id = p_trip_id;
end $$;

revoke all on function public.save_trip_rates(uuid, text, jsonb, text[]) from public;
grant execute on function public.save_trip_rates(uuid, text, jsonb, text[]) to authenticated;
