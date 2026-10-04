-- 일정 카드 2차. 이동은 일정 한 줄이 아니라 두 장소 사이에 붙는 기록이다.
-- 타임라인은 직전 번호 장소 → 이 장소 쌍에만 「+ 이동 방법」을 보여 준다. 순서가 바뀌어 쌍이 이웃하지 않게 되면
-- 그 기록은 보이지 않을 뿐 남는다(되돌리면 다시 보인다). 장소를 지우면 함께 지워진다.

-- 이동 일정(kind = 'move')은 폐지. 원격 데이터는 개발용이라 옮기지 않고 지운다.
delete from public.schedule_items where kind = 'move';
alter table public.schedule_items drop constraint schedule_items_kind_check;
alter table public.schedule_items
  add constraint schedule_items_kind_check check (kind in ('place', 'flight', 'note'));

create table public.moves (
  id           uuid primary key default gen_random_uuid(),
  trip_id      uuid not null references public.trips(id) on delete cascade,
  from_item_id uuid not null references public.schedule_items(id) on delete cascade,
  to_item_id   uuid not null references public.schedule_items(id) on delete cascade,
  mode         text check (mode in ('subway', 'bus', 'train', 'taxi', 'walk', 'flight')),
  detail       text check (char_length(detail) <= 60),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (from_item_id, to_item_id),
  -- 둘 다 비면 기록이 아니라 지우기다
  check (mode is not null or detail is not null)
);

create trigger moves_updated_at before update on public.moves
  for each row execute function public.set_updated_at();

alter table public.moves enable row level security;

-- 일정과 같은 경계(멤버만). 두 장소가 모두 같은 여행의 일정이어야 남의 일정에 기록을 붙이지 못한다.
create policy "moves_all" on public.moves
  for all to authenticated
  using (public.is_trip_member(trip_id))
  with check (
    public.is_trip_member(trip_id)
    and exists (select 1 from public.schedule_items i where i.id = from_item_id and i.trip_id = moves.trip_id)
    and exists (select 1 from public.schedule_items i where i.id = to_item_id and i.trip_id = moves.trip_id)
  );

alter publication supabase_realtime add table public.moves;
-- DELETE 이벤트에도 trip_id 가 실려야 필터에 걸린다
alter table public.moves replica identity full;
