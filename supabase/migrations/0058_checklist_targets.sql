-- 체크리스트 연결 (#16 ②-b).
--
-- 체크리스트 항목은 일정 카드 · 항공편 · 숙소 여러 개에 붙는다(2026-10-13 사용자 결정). 한 줄이 연결 하나다.
--   * 대상은 셋 중 정확히 하나. 같은 항목에 같은 대상은 한 번만
--   * 모두 같은 여행의 것만(복합 FK). 항목이나 대상을 지우면 연결만 지운다(cascade) — 항목 · 대상은 그대로
--   * 항공편은 일정 카드가 아니라 항공편에 붙는다 — 카드가 기간 밖으로 지워져도 항공편 상세에 남게
--
-- 저장(save_checklist_item)은 항목 칸과 연결을 한 트랜잭션으로 — 새 항목이 연결만 실패해 반쯤 남지 않게.

create table public.checklist_targets (
  id                uuid primary key default gen_random_uuid(),
  trip_id           uuid not null,
  item_id           uuid not null,
  schedule_item_id  uuid,
  flight_id         uuid,
  stay_id           uuid,
  created_at        timestamptz not null default now(),
  constraint checklist_targets_item_fkey foreign key (item_id, trip_id)
    references public.checklist_items(id, trip_id) on delete cascade,
  constraint checklist_targets_schedule_fkey foreign key (schedule_item_id, trip_id)
    references public.schedule_items(id, trip_id) on delete cascade,
  constraint checklist_targets_flight_fkey foreign key (flight_id, trip_id)
    references public.flights(id, trip_id) on delete cascade,
  constraint checklist_targets_stay_fkey foreign key (stay_id, trip_id)
    references public.stays(id, trip_id) on delete cascade,
  constraint checklist_targets_one_chk check (num_nonnulls(schedule_item_id, flight_id, stay_id) = 1),
  constraint checklist_targets_schedule_key unique (item_id, schedule_item_id),
  constraint checklist_targets_flight_key unique (item_id, flight_id),
  constraint checklist_targets_stay_key unique (item_id, stay_id)
);
create index checklist_targets_trip_idx on public.checklist_targets(trip_id);
-- 대상을 지울 때 cascade 가 찾는다
create index checklist_targets_schedule_idx on public.checklist_targets(schedule_item_id);
create index checklist_targets_flight_idx on public.checklist_targets(flight_id);
create index checklist_targets_stay_idx on public.checklist_targets(stay_id);

-- ---------- RLS ----------
alter table public.checklist_targets enable row level security;

-- 멤버만. 익명도 자기 여행이면 된다(둘러보기)
create policy "checklist_targets_all" on public.checklist_targets
  for all to authenticated
  using (public.is_trip_member(trip_id))
  with check (public.is_trip_member(trip_id));

-- 실시간: 일행이 바꾼 연결 · 대상을 지워 풀린 연결이 바로 보이게
alter publication supabase_realtime add table public.checklist_targets;
alter table public.checklist_targets replica identity full;

-- ---------- 저장 ----------
-- 추가 · 편집 창의 「저장」.
--   p_id      null 이면 새 항목
--   p_fields  { status, title, due_date, body, links, pinned_by } — 편집이면 바뀐 칸만(없는 칸은 그대로)
--   p_add     [{ schedule_item_id | flight_id | stay_id }] — 더할 연결. 그사이 지워진 대상 · 이미 있는 연결은 건너뛴다
--   p_remove  같은 모양 — 뺄 연결
-- 고칠 항목이 없으면(그사이 일행이 지웠다 · 다른 여행) P0002 로 거부한다. 항목 id 를 돌려준다
create or replace function public.save_checklist_item(
  p_trip uuid, p_id uuid, p_fields jsonb, p_add jsonb default '[]', p_remove jsonb default '[]'
)
returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_id uuid;
begin
  if p_id is null then
    insert into public.checklist_items (trip_id, status, title, due_date, body, links, pinned_by)
    values (
      p_trip,
      coalesce(p_fields ->> 'status', 'todo'),
      p_fields ->> 'title',
      (p_fields ->> 'due_date')::date,
      coalesce(p_fields ->> 'body', ''),
      coalesce(p_fields -> 'links', '[]'::jsonb),
      (p_fields ->> 'pinned_by')::uuid
    )
    returning id into v_id;
  else
    update public.checklist_items set
      status    = case when p_fields ? 'status' then p_fields ->> 'status' else status end,
      title     = case when p_fields ? 'title' then p_fields ->> 'title' else title end,
      due_date  = case when p_fields ? 'due_date' then (p_fields ->> 'due_date')::date else due_date end,
      body      = case when p_fields ? 'body' then p_fields ->> 'body' else body end,
      links     = case when p_fields ? 'links' then p_fields -> 'links' else links end,
      pinned_by = case when p_fields ? 'pinned_by' then (p_fields ->> 'pinned_by')::uuid else pinned_by end
    where id = p_id and trip_id = p_trip
    returning id into v_id;
    if v_id is null then
      raise exception 'checklist item not found' using errcode = 'P0002';
    end if;
  end if;

  delete from public.checklist_targets t
  using jsonb_to_recordset(p_remove) r(schedule_item_id uuid, flight_id uuid, stay_id uuid)
  where t.item_id = v_id
    and t.schedule_item_id is not distinct from r.schedule_item_id
    and t.flight_id is not distinct from r.flight_id
    and t.stay_id is not distinct from r.stay_id;

  insert into public.checklist_targets (trip_id, item_id, schedule_item_id, flight_id, stay_id)
  select p_trip, v_id, r.schedule_item_id, r.flight_id, r.stay_id
  from jsonb_to_recordset(p_add) r(schedule_item_id uuid, flight_id uuid, stay_id uuid)
  where (r.schedule_item_id is null
         or exists (select 1 from public.schedule_items s where s.id = r.schedule_item_id and s.trip_id = p_trip))
    and (r.flight_id is null
         or exists (select 1 from public.flights f where f.id = r.flight_id and f.trip_id = p_trip))
    and (r.stay_id is null
         or exists (select 1 from public.stays s where s.id = r.stay_id and s.trip_id = p_trip))
  on conflict do nothing;

  return v_id;
end $$;
