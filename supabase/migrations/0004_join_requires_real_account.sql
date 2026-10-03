-- 둘러보기(익명) 계정으로는 남의 여행에 합류할 수 없게 한다.
--
-- Supabase 익명 사용자도 authenticated role 을 받으므로 기존의
-- `auth.uid() is null` 검사만으로는 걸러지지 않는다. 구분은 JWT 의
-- is_anonymous claim 뿐이다.
--
-- 막는 이유: 익명 계정은 복구 수단이 없다. 쿠키가 지워지면 멤버십이 사라지고,
-- 여행 주인 쪽에는 정체를 알 수 없는 멤버만 남는다. 자기 데이터만 망가지는
-- 다른 데모 동작과 달리 타인의 리소스에 흔적을 남긴다.
create or replace function public.join_trip_by_token(p_token text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_trip_id uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    raise exception 'anonymous account cannot join a trip';
  end if;
  select id into v_trip_id from public.trips where invite_token = p_token;
  if v_trip_id is null then raise exception 'invalid invite token'; end if;
  insert into public.trip_members (trip_id, user_id, role) values (v_trip_id, auth.uid(), 'member')
  on conflict do nothing;
  return v_trip_id;
end $$;
