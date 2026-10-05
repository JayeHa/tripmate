-- 날짜 메모(note 일정)는 글 한 칸이다 — 메모 목록(memos)을 붙이지 않는다(사용자 결정 2026-10-05).
--
-- 날짜 메모를 누르면 「시간 + 메모」 만 고치는 창이 열려서, note 에 붙은 memos 는 고치거나 지울 길이 없었다.
-- 0027 이 예전 note 메모를 memos 로 옮기면서 생긴 줄들을 note 의 글(name) 아래에 줄바꿈으로 합치고 지운다
-- (★ 중요는 「★ 」 를 앞에 붙여 남긴다). 앞으로 note 에 메모를 붙이면 거부한다(트리거). 장소 · 항공편은 그대로 붙는다.

update public.schedule_items si
set name = si.name || E'\n' || merged.body
from (
  select m.schedule_item_id,
         string_agg(case when m.starred then '★ ' || m.body else m.body end, E'\n' order by m.created_at) body
  from public.memos m
  join public.schedule_items s on s.id = m.schedule_item_id
  where s.kind = 'note'
  group by m.schedule_item_id
) merged
where si.id = merged.schedule_item_id;

delete from public.memos m
using public.schedule_items s
where s.id = m.schedule_item_id and s.kind = 'note';

create or replace function public.check_memo_item()
returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if exists (select 1 from public.schedule_items where id = new.schedule_item_id and kind = 'note') then
    raise exception 'a day memo has no memos';
  end if;
  return new;
end $$;

create trigger memos_item_check
  before insert or update of schedule_item_id on public.memos
  for each row execute function public.check_memo_item();
