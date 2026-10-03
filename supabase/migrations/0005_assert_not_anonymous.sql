-- 익명(둘러보기) 계정 거부를 함수 하나로 모은다.
--
-- 각 함수가 조건을 직접 쓰면 방향을 뒤집어 쓰거나(`if not ...`) 주석 처리해도
-- 눈에 띄지 않는다. 호출 한 줄로 고정하면 「불렀는가」만 보면 되고,
-- 조건의 정확성은 이 함수 하나만 지키면 된다.
create or replace function public.assert_not_anonymous()
returns void language plpgsql stable as $$
begin
  if coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    raise exception 'anonymous account is not allowed here';
  end if;
end $$;

-- join_trip_by_token 이 헬퍼를 쓰도록 바꾼다. 동작은 0004 와 같다.
create or replace function public.join_trip_by_token(p_token text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_trip_id uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  perform public.assert_not_anonymous();
  select id into v_trip_id from public.trips where invite_token = p_token;
  if v_trip_id is null then raise exception 'invalid invite token'; end if;
  insert into public.trip_members (trip_id, user_id, role) values (v_trip_id, auth.uid(), 'member')
  on conflict do nothing;
  return v_trip_id;
end $$;
