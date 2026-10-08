-- 지출 영수증(사진 · PDF) — 지출에 붙은 파일 목록과, 개발 중 쓰는 Supabase Storage 버킷 · 권한(#18 ⑫-a).
--
-- 최종 저장소는 Cloudflare R2 다. 그 전까지 Supabase Storage 를 쓰고(docs/engineering/library-policy.md 결정 기록),
-- 파일은 늘 서버 라우트가 발급한 서명 주소로 올리고 본다. 그래서 이 표는 저장소를 모르는 키만 둔다.
--
-- - key: `{여행 id}/{uuid}.{확장자}`. 첫 칸이 여행이라 버킷 정책이 경로로 멤버를 가린다(R2 로 가면 서버가 같은 규칙으로 가린다)
-- - 파일은 고르는 순간 올리고(지출 저장 전), 지출을 저장할 때 이 표에 붙인다. 붙지 못한 파일 정리는 따로 한다(#155)
-- - 한 지출에 10장까지 — 화면이 막고, 여기서도 트리거로 막는다

create table public.expense_receipts (
  id         uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses(id) on delete cascade,
  trip_id    uuid not null references public.trips(id) on delete cascade,
  key        text not null unique,
  name       text not null check (char_length(name) between 1 and 200),
  mime       text not null check (mime in ('image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf')),
  size       integer not null check (size > 0 and size <= 10485760),
  created_by uuid references public.profiles(id) default auth.uid(),
  created_at timestamptz not null default now(),
  -- 파일은 그 여행 폴더 안에만
  constraint expense_receipts_key_chk check (key like trip_id::text || '/%')
);

create index expense_receipts_expense_idx on public.expense_receipts(expense_id);
create index expense_receipts_trip_idx on public.expense_receipts(trip_id);

alter table public.expense_receipts enable row level security;
-- 그 여행 멤버만. 붙이는 지출도 같은 여행이어야 한다(다른 여행 지출에 붙이지 못하게)
create policy "expense_receipts_all" on public.expense_receipts
  for all to authenticated
  using (public.is_trip_member(trip_id))
  with check (
    public.is_trip_member(trip_id)
    and exists (select 1 from public.expenses e where e.id = expense_id and e.trip_id = expense_receipts.trip_id)
  );

-- 한 지출에 10장까지
create or replace function public.expense_receipts_limit()
returns trigger
language plpgsql set search_path = public as $$
begin
  if (select count(*) from public.expense_receipts where expense_id = new.expense_id) >= 10 then
    raise exception 'too many receipts for one expense';
  end if;
  return new;
end $$;

create trigger expense_receipts_limit
  before insert on public.expense_receipts
  for each row execute function public.expense_receipts_limit();

-- 실시간: 일행이 붙인 영수증이 바로 보이게
alter publication supabase_realtime add table public.expense_receipts;
alter table public.expense_receipts replica identity full;

-- 개발 중 저장소 — 비공개 버킷. 장당 10MB, 사진 · PDF 만
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'receipts', 'receipts', false, 10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf']
)
on conflict (id) do nothing;

-- 경로 첫 칸(여행 id)의 멤버만 올리고 · 보고 · 지운다. 서명 주소도 이 정책을 거쳐 발급된다
create policy "receipts_member_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'receipts' and public.is_trip_member(((storage.foldername(name))[1])::uuid));
create policy "receipts_member_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'receipts' and public.is_trip_member(((storage.foldername(name))[1])::uuid));
create policy "receipts_member_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'receipts' and public.is_trip_member(((storage.foldername(name))[1])::uuid));
