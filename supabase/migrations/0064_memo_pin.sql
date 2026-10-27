-- 메모 「홈에 고정」 (#17)
--   * 장소 메모(memos)와 날짜 메모(note 일정)에 고정한 사람(pinned_by)을 적는다. 체크리스트 · 바우처와 같다 —
--     일행 모두의 홈에 보이고 누구나 푼다. ★ 중요와는 따로다(중요 표시만으로는 홈에 뜨지 않는다, 사용자 결정 2026-10-27)
--   * 날짜 메모는 note 일정의 제목 한 칸이라 고정 칸을 schedule_items 에 둔다. note 가 아닌 일정은 고정할 수 없다(check)
--   * 고친 사람 · 권한은 기존 정책 그대로 — 여행 멤버 누구나(memos_all · items_all)

alter table public.memos
  add column pinned_by uuid references public.profiles(id) on delete set null;

alter table public.schedule_items
  add column pinned_by uuid references public.profiles(id) on delete set null,
  add constraint schedule_items_pin_note_only check (pinned_by is null or kind = 'note');
