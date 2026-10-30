-- 여행 가이드 보관함 쓰기(#17 ⑤-b) — 멤버가 담고 · 메모를 고치고 · 뺀다.
-- 담기: 붙일 수 있는 장소만(내 장소 · 이 여행 일정 · 숙소 · 보관함에 있는 장소, can_attach_place)
create policy "trip_places_insert" on public.trip_places
  for insert to authenticated
  with check (public.is_trip_member(trip_id) and public.can_attach_place(place_id, trip_id));

-- 고치기: 메모만. 여행 · 장소 · 담은 사람은 바꾸지 못한다(칸 권한)
create policy "trip_places_update" on public.trip_places
  for update to authenticated
  using (public.is_trip_member(trip_id))
  with check (public.is_trip_member(trip_id));
revoke update on public.trip_places from authenticated;
grant update (memo) on public.trip_places to authenticated;

-- 빼기: 이 여행 일정(대체 장소 포함)에 있는 장소는 뺄 수 없다 — 일정에서 먼저 지운다.
-- 막히면 0행이 지워진다(오류 없음). 화면은 지워진 행을 돌려받아 확인한다
create policy "trip_places_delete" on public.trip_places
  for delete to authenticated
  using (
    public.is_trip_member(trip_id)
    and not exists (
      select 1 from public.schedule_items si
      where si.trip_id = trip_places.trip_id and si.place_id = trip_places.place_id
    )
  );
