-- 프로필 사진 지우기가 조용히 실패했다(0043). Storage 의 remove 는 지울 파일을 RLS 를 거쳐 먼저 찾는데,
-- 공개 버킷이라 읽기 정책을 두지 않아 0건으로 찾고 오류 없이 끝났다. 자기 폴더는 읽을 수 있게 한다
-- (공개 주소로 보는 것과는 상관없다 — 공개 주소는 정책을 거치지 않는다)
create policy "avatars_own_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
