-- 메모 작성자 트리거가 계정 삭제를 막지 않게.
--
-- 0027 의 keep_memo_author 는 고칠 때 작성자를 늘 옛 값으로 되돌렸다. 그런데 프로필을 지우면 FK 의
-- on delete set null 이 memos 를 UPDATE 하고, 이 트리거가 null 을 옛 id 로 되돌려 메모가 없는 프로필을 가리키게 됐다
-- (값이 그대로라 FK 검사도 건너뛴다). 고칠 때는 null 로 바꾸는 것만 허용한다 — 남의 이름으로 바꾸지는 못한다.

create or replace function public.keep_memo_author()
returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.author_id := auth.uid();
  elsif new.author_id is not null then
    new.author_id := old.author_id;
  end if;
  return new;
end $$;
