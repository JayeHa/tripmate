-- 가계부 「환급」 — 택스 리펀 기록 (#300 ①).
--
-- 일본은 2026-11-01 구매분부터 면세가 「세금 내고 사고 → 출국할 때 세관 확인 → 매장이 정한 사업자가 환급」 으로 바뀌었다.
-- 환급 건마다 어디까지 왔는지 따라간다. 일행이 함께 보고 고친다(여행 멤버 누구나). 일본 전용이 아니라 나라와 상관없이 쓴다.
--   * 매장(필수) · 환급 사업자(J-TaxRefund · JPrefund …, 선택) · 신청 사이트 링크 · 거래번호
--   * 구매 날짜 · 시각(선택) — 비용(expenses.spent_on · spent_time)과 같은 모양
--   * 구매 금액 · 환급 예정액(선택) · 통화(여행 통화 중 하나, 화면이 고른다). 둘을 같이 두면 수수료가 보인다
--   * 환급 방법: card(카드) · cash(공항 현금 카운터) · app(앱 · 페이) · bank(계좌). 방법 메모에 어떤 카드인지
--   * 단계: 신청함 → 세관 확인함(customs_at) → 받았어요(received_at). 받았으면 세관 확인도 있어야 한다(순서)
--   * 환급액은 가계부 합계 · 정산에 넣지 않는다(2026-11-01 사용자 결정). 비용 연결 · 사진은 다음 단계에서 더한다

create table public.tax_refunds (
  id              uuid primary key default gen_random_uuid(),
  trip_id         uuid not null references public.trips(id) on delete cascade,
  store           text not null check (char_length(btrim(store)) between 1 and 60),
  provider        text check (char_length(btrim(provider)) between 1 and 40),
  site_url        text check (char_length(site_url) <= 500),
  transaction_id  text check (char_length(transaction_id) between 1 and 60),
  bought_on       date,
  bought_time     time,
  currency        text not null check (currency ~ '^[A-Z]{3}$'),
  amount          numeric(12, 2) check (amount >= 0 and amount < 10000000000),
  refund_amount   numeric(12, 2) check (refund_amount >= 0 and refund_amount < 10000000000),
  method          text not null check (method in ('card', 'cash', 'app', 'bank')),
  method_note     text check (char_length(method_note) between 1 and 60),
  customs_at      timestamptz,
  received_at     timestamptz,
  memo            text check (char_length(memo) <= 500),
  created_by      uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- 시각은 날짜가 있을 때만
  constraint tax_refunds_time_chk check (bought_on is not null or bought_time is null),
  -- 받았으면 세관 확인도 거쳤다
  constraint tax_refunds_steps_chk check (received_at is null or customs_at is not null)
);
create index tax_refunds_trip_idx on public.tax_refunds(trip_id);

create trigger tax_refunds_updated_at before update on public.tax_refunds
  for each row execute function public.set_updated_at();

alter table public.tax_refunds enable row level security;

-- 멤버만. 익명도 자기 여행이면 된다(둘러보기)
create policy "tax_refunds_all" on public.tax_refunds
  for all to authenticated
  using (public.is_trip_member(trip_id))
  with check (public.is_trip_member(trip_id));

-- 실시간: 일행이 공항에서 「세관 확인했어요」 를 누르면 바로 보이게
alter publication supabase_realtime add table public.tax_refunds;
alter table public.tax_refunds replica identity full;
