-- 택스 리펀 「누구 것」 · 바코드 번호 (#300).
--
-- 일행이 각자 산 영수증을 한 여행에 모아 적는다 — 환급은 산 사람의 카드 · 여권으로 들어와 누구 것인지가 필요하다.
--   * owner_id: 환급 받는 멤버. 비면 정하지 않음. 넣을 때 · 바꿀 때 그 여행의 멤버만(정책 with check).
--     멤버가 나가도 기록은 남는다(프로필이 지워지면 비운다)
--   * barcode: 사업자가 주는 면세 양식 번호(Global Blue 「면세 양식 바코드」 20자리 등). 화면은 번호와 복사만 — 바코드 그림은 캡처 사진으로
alter table public.tax_refunds
  add column owner_id uuid references public.profiles(id) on delete set null,
  add column barcode text check (char_length(barcode) between 1 and 60);

comment on column public.tax_refunds.owner_id is '환급 받는 멤버(선택). 그 여행의 멤버만';
comment on column public.tax_refunds.barcode is '면세 양식 번호(선택) — 사업자가 주는 바코드 숫자';

drop policy "tax_refunds_all" on public.tax_refunds;
create policy "tax_refunds_all" on public.tax_refunds
  for all to authenticated
  using (public.is_trip_member(trip_id))
  with check (
    public.is_trip_member(trip_id)
    and (
      owner_id is null
      or exists (
        select 1 from public.trip_members m
        where m.trip_id = tax_refunds.trip_id and m.user_id = tax_refunds.owner_id
      )
    )
  );
