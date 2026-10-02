-- insert ... returning 시 SELECT 정책이 먼저 검사되는데, 이 시점엔 아직
-- on_trip_created 트리거가 trip_members 행을 넣기 전이라 소유자도 거부됨.
-- 소유자는 멤버 여부와 무관하게 자기 trip을 볼 수 있어야 한다.
drop policy "trips_select_member" on public.trips;
create policy "trips_select_member" on public.trips
  for select to authenticated using (owner_id = auth.uid() or public.is_trip_member(id));
