-- 노트 · 바우처 (#16 바우처 ①).
--
-- 탑승권 · 입장권 · 예약 확인서. 일행이 함께 보고 고친다(여행 멤버 누구나). 파일 규칙은 docs/policies/files.md 「바우처」.
--   * 원본 파일은 하나(사진 또는 PDF, 교체만). 파일 없이 번호만 있는 바우처도 된다
--   * PDF 는 올리는 사람의 브라우저가 현장용 페이지(pages, 폼에 적은 그대로 '1, 3')를 그림으로 만들어 page_keys 에 둔다.
--     목록 썸네일은 thumb_key. 그리지 못하면 둘 다 비어 있다(뷰어는 원본 열기로)
--   * 주인(owners): 멤버 id 목록, 비면 「모두」
--   * 번호(numbers): [{ label, owner, value }] — 종류 · 주인(빈 글자 = 모두) · 값
--   * 연결은 일정 카드 · 항공편 · 숙소 중 하나이거나 없다(기타). 대상을 지우면 연결만 풀린다
--   * 사용일(use_date)은 연결이 없을 때만 — 연결이 있으면 그 날짜를 쓴다
--   * 홈에 고정: 고정한 사람(pinned_by). 체크리스트와 같다

-- 키가 모두 그 여행 폴더 안인가(`{여행 id}/…`, `..` 없음) — check 에서 배열을 검사하려고 함수로 둔다
create or replace function public.keys_in_trip(p_keys text[], p_trip uuid)
returns boolean
language sql immutable set search_path = '' as $$
  select coalesce(bool_and(k like p_trip::text || '/%' and position('..' in k) = 0), true)
  from unnest(p_keys) k
$$;

create table public.vouchers (
  id                uuid primary key default gen_random_uuid(),
  trip_id           uuid not null references public.trips(id) on delete cascade,
  title             text not null check (char_length(btrim(title)) between 1 and 100),
  file_key          text unique,
  file_name         text check (char_length(file_name) between 1 and 200),
  file_mime         text check (file_mime in ('image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf')),
  file_size         integer check (file_size > 0 and file_size <= 20971520),
  pages             text not null default '1' check (pages ~ '^[0-9, ]{0,40}$'),
  page_keys         text[] not null default '{}' check (cardinality(page_keys) <= 5),
  thumb_key         text,
  owners            uuid[] not null default '{}' check (cardinality(owners) <= 20),
  numbers           jsonb not null default '[]'::jsonb
                      check (jsonb_typeof(numbers) = 'array' and jsonb_array_length(numbers) <= 10),
  schedule_item_id  uuid,
  flight_id         uuid,
  stay_id           uuid,
  use_date          date,
  site_title        text not null default '' check (char_length(site_title) <= 100),
  site_url          text not null default '' check (char_length(site_url) <= 2000),
  memo              text not null default '' check (char_length(memo) <= 500),
  pinned_by         uuid references public.profiles(id) on delete set null,
  created_by        uuid default auth.uid() references public.profiles(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  -- 원본 네 칸은 함께 있거나 함께 없다
  constraint vouchers_file_chk check (num_nonnulls(file_key, file_name, file_mime, file_size) in (0, 4)),
  -- 파일은 그 여행 폴더 안에만
  constraint vouchers_keys_chk check (
    public.keys_in_trip(array_remove(array[file_key, thumb_key], null) || page_keys, trip_id)
  ),
  -- 연결은 같은 여행의 대상 하나까지. 대상을 지우면 그 칸만 비운다(trip_id 는 그대로)
  constraint vouchers_schedule_fkey foreign key (schedule_item_id, trip_id)
    references public.schedule_items(id, trip_id) on delete set null (schedule_item_id),
  constraint vouchers_flight_fkey foreign key (flight_id, trip_id)
    references public.flights(id, trip_id) on delete set null (flight_id),
  constraint vouchers_stay_fkey foreign key (stay_id, trip_id)
    references public.stays(id, trip_id) on delete set null (stay_id),
  constraint vouchers_target_chk check (num_nonnulls(schedule_item_id, flight_id, stay_id) <= 1),
  constraint vouchers_use_date_chk check (use_date is null or num_nonnulls(schedule_item_id, flight_id, stay_id) = 0)
);
create index vouchers_trip_idx on public.vouchers(trip_id);
-- 대상을 지울 때 set null 이 찾는다
create index vouchers_schedule_idx on public.vouchers(schedule_item_id);
create index vouchers_flight_idx on public.vouchers(flight_id);
create index vouchers_stay_idx on public.vouchers(stay_id);

create trigger vouchers_updated_at before update on public.vouchers
  for each row execute function public.set_updated_at();

-- ---------- RLS ----------
alter table public.vouchers enable row level security;

-- 멤버만. 익명도 자기 여행이면 된다(둘러보기)
create policy "vouchers_all" on public.vouchers
  for all to authenticated
  using (public.is_trip_member(trip_id))
  with check (public.is_trip_member(trip_id));

-- 실시간: 일행이 올리고 고친 바우처 · 대상을 지워 풀린 연결이 바로 보이게
alter publication supabase_realtime add table public.vouchers;
alter table public.vouchers replica identity full;

-- ---------- 저장소(개발 중 Supabase Storage, 최종 R2) ----------
-- 비공개 버킷. 원본은 압축하지 않아 영수증(10MB)보다 큰 20MB. 그림(page_keys · thumb_key)은 PNG · JPEG
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vouchers', 'vouchers', false, 20971520,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf']
)
on conflict (id) do nothing;

-- 경로 첫 칸(여행 id)의 멤버만 올리고 · 보고 · 지운다. 지우기는 읽기 정책으로 먼저 찾으므로 select 도 둔다(files.md 「함정」)
create policy "vouchers_member_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'vouchers' and public.is_trip_member(((storage.foldername(name))[1])::uuid));
create policy "vouchers_member_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'vouchers' and public.is_trip_member(((storage.foldername(name))[1])::uuid));
create policy "vouchers_member_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'vouchers' and public.is_trip_member(((storage.foldername(name))[1])::uuid));
