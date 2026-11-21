-- 이동 방법 창에서 소요 시간을 직접 정한다(노선도 6차). 비어 있으면 지금처럼 직선거리로 센다.
-- 수단 · 소요 시간 · 상세가 모두 비면 기록이 아니라 지우기다(= 자동으로).
alter table public.moves
  add column minutes smallint check (minutes between 1 and 1440);

alter table public.moves drop constraint moves_check;
alter table public.moves
  add constraint moves_check check (mode is not null or detail is not null or minutes is not null);
