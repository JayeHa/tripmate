-- moves 의 두 장소가 그 move 와 같은 여행의 일정이라는 불변식을 RLS(쓸 때만 검사)가 아니라 FK 로 고정한다.
-- 일정의 trip_id 가 나중에 바뀌어도 어긋나지 않는다: 이동 기록이 붙은 일정은 다른 여행으로 옮겨지지 않는다(NO ACTION).
alter table public.schedule_items add constraint schedule_items_id_trip_key unique (id, trip_id);

alter table public.moves
  drop constraint moves_from_item_id_fkey,
  drop constraint moves_to_item_id_fkey,
  add constraint moves_from_item_fkey foreign key (from_item_id, trip_id)
    references public.schedule_items (id, trip_id) on delete cascade,
  add constraint moves_to_item_fkey foreign key (to_item_id, trip_id)
    references public.schedule_items (id, trip_id) on delete cascade;
