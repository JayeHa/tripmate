-- 프로필 사진 올리기(#94).
-- avatar_url 은 그대로 「지금 보이는 사진」 이다(헤더 · 멤버 · 메모 · 가계부가 이 칸만 읽는다).
-- default_avatar_url 은 가입할 때 받은 구글 사진 — 「기본 이미지로」 가 여기로 되돌린다(없으면 이니셜).
alter table public.profiles add column default_avatar_url text;

-- 지금까지의 avatar_url 은 모두 가입 때 받은 구글 사진이다(올리기 기능이 없었다)
update public.profiles set default_avatar_url = avatar_url;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url, default_avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end $$;

-- 공개 버킷 — 아바타는 화면 곳곳에 그려져 서명 주소 대신 고정 주소를 profiles.avatar_url 에 둔다.
-- 키 = {사용자 id}/{uuid}.jpg 라 주소를 짐작할 수 없다. 화면에서 줄여 올리므로(긴 변 512) 한 장 2MB 면 넉넉하다
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- 자기 폴더(경로 첫 칸 = 내 id)에만 올리고 지운다. 둘러보기(익명)는 막는다 — 사진을 볼 일행이 없고 매일 지워지는 계정이다.
-- 공개 버킷이라 읽기 정책은 없다(공개 주소로 읽는다)
create policy "avatars_own_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
    and coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false
  );
create policy "avatars_own_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
