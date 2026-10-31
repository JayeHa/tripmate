-- 비용의 시각(선택, #288) — 같은 날 안에서 시간순으로 보이고 줄에 「14:20」 으로 나온다.
-- 여행준비(쓴 날 없음) 비용은 앱이 늘 비워 보낸다. 제약을 걸지 않는다 — 여행 기간이 바뀌어 쓴 날이 비는 경우가 생겨도 막히지 않게
alter table public.expenses add column spent_time time;

comment on column public.expenses.spent_time is '쓴 시각(선택). 같은 날 안의 순서 · 표시에 쓴다';
