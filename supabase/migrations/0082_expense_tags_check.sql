-- 비용 태그 검사 보강 (#308, PR #312 리뷰).
--
--   * 1차원 목록만 — cardinality · unnest 는 다차원 배열을 펼쳐 세서 '{{a},{b}}' 가 통과했다(화면은 문자열 목록만 다룬다)
--   * 대소문자만 다른 태그도 겹친 것으로 본다 — 화면이 「Asics」 와 「asics」 를 같은 태그로 다룬다
-- 글자 수는 그대로 코드 포인트(char_length) 기준이다. 화면도 같은 기준으로 센다

create or replace function public.expense_tags_valid(tags text[])
returns boolean
language sql
immutable
security invoker
set search_path = ''
as $$
  select (array_ndims(tags) is null or array_ndims(tags) = 1)
    and coalesce(cardinality(tags), 0) <= 5
    and not exists (
      select 1 from unnest(tags) t
      where t is null or t <> btrim(t) or char_length(t) not between 1 and 20
    )
    and coalesce(cardinality(tags), 0) = (select count(distinct lower(t)) from unnest(tags) t);
$$;
