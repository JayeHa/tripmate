-- 비용 태그 (#308).
--
-- 같은 카테고리 안에서 「런닝」 · 「치이카와 굿즈」 처럼 따로 묶어 합계를 보려고 비용마다 태그를 여러 개 단다.
--   * 태그 목록은 따로 두지 않는다 — 그 여행 비용의 태그에서 모은다(비용이 여행 단위라 일행이 함께 쓴다)
--   * 한 비용에 5개까지, 하나는 1–20자 · 앞뒤 공백 없음 · 같은 태그를 두 번 달지 않는다(화면이 다듬어 보내고 DB 가 막는다)
--   * 권한은 비용과 같다(칸이 하나 늘 뿐 정책은 그대로)

create function public.expense_tags_valid(tags text[])
returns boolean
language sql
immutable
security invoker
set search_path = ''
as $$
  select coalesce(cardinality(tags), 0) <= 5
    and not exists (
      select 1 from unnest(tags) t
      where t is null or t <> btrim(t) or char_length(t) not between 1 and 20
    )
    and coalesce(cardinality(tags), 0) = (select count(distinct t) from unnest(tags) t);
$$;

alter table public.expenses
  add column tags text[] not null default '{}'
  constraint expenses_tags_chk check (public.expense_tags_valid(tags));

comment on column public.expenses.tags is '태그(선택, 5개까지) — 태그별 합계 · 내역 필터';
