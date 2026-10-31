import { daysUntil } from "@/entities/checklist";
import {
  computeNetBalances,
  type ExpenseWithSplits,
  personKey,
  type PersonRef,
  sumExpenses,
} from "@/entities/expense";
import type { Flight } from "@/entities/flight";
import type { ScheduleItem } from "@/entities/schedule-item";
import { nightsOf, type Stay } from "@/entities/stay";
import type { Voucher } from "@/entities/voucher";
import { type ExchangeRates, formatMoney, MissingRateError } from "@/shared/lib/money";

/** 오늘 쓸 바우처를 고르는 데 필요한 것 */
type VoucherDay = {
  items: ScheduleItem[];
  flights: Flight[];
  stays: Stay[];
  dayIndex: number;
  /** 그날 「YYYY-MM-DD」 */
  date: string;
};

/**
 * 그날 쓰는 바우처인가 — 일정은 그 일정의 날, 항공편은 탑승일, 숙소는 체크인 ~ 체크아웃, 연결 없는 것은 사용일
 */
function usedOn(v: Voucher, day: VoucherDay): boolean {
  if (v.schedule_item_id)
    return day.items.some((i) => i.id === v.schedule_item_id && i.day_index === day.dayIndex);
  if (v.flight_id) return day.flights.some((f) => f.id === v.flight_id && f.dep_date === day.date);
  if (v.stay_id)
    return day.stays.some(
      (s) => s.id === v.stay_id && s.check_in_date <= day.date && day.date <= s.check_out_date,
    );
  return v.use_date === day.date;
}

/** 정렬 순서 — 내 것 → 모두의 것 → 일행 것 */
function ownerRank(v: Voucher, userId: string | null): number {
  if (v.owners.length === 0) return 1;
  return userId && v.owners.includes(userId) ? 0 : 2;
}

/** 그날 일정에 자리가 없을 때(카드를 못 찾음 · 연결 없이 사용일만) — 맨 뒤 */
const NO_POSITION = Number.MAX_SAFE_INTEGER;

/**
 * 그날 일정에서의 자리 — 연결한 일정, 항공편 · 숙소는 그날의 그 카드 순서. 일정 화면과 같은 순서가 된다.
 * 카드를 못 찾거나(지움 · 기간 밖) 연결이 없으면 맨 뒤
 */
function dayPosition(v: Voucher, day: VoucherDay): number {
  const card = day.items.find(
    (i) =>
      i.day_index === day.dayIndex &&
      (i.id === v.schedule_item_id ||
        (v.flight_id !== null && i.flight_id === v.flight_id) ||
        (v.stay_id !== null && i.stay_id === v.stay_id)),
  );
  return card ? card.position : NO_POSITION;
}

/**
 * 그날 쓸 바우처 — 이미 쓴 것은 빼고, 그날 일정 순서대로. 같은 자리(한 카드에 여럿 · 자리 없음)는 내 것 → 모두 → 일행 것,
 * 그다음 원래 순서
 */
export function todayVouchers(vouchers: Voucher[], day: VoucherDay, userId: string | null) {
  return vouchers
    .filter((v) => !v.used_at && usedOn(v, day))
    .map((v, i) => ({ v, i, pos: dayPosition(v, day), rank: ownerRank(v, userId) }))
    .sort((a, b) => a.pos - b.pos || a.rank - b.rank || a.i - b.i)
    .map(({ v }) => v);
}

/** 오늘 지출 카드 — 큰 금액(기준 화폐)과 아래 한 줄 */
export type SpendView = { total: string; sub: string };

/** 내 몫의 합(기준 화폐). 환율을 모르는 비용이 있으면 null — 틀린 합을 보이지 않는다 */
function spentByMe(
  expenses: ExpenseWithSplits[],
  people: PersonRef[],
  me: PersonRef,
  home: string,
  rates: ExchangeRates,
): number | null {
  try {
    return computeNetBalances(expenses, people, home, rates).spent[personKey(me)] ?? 0;
  } catch (e) {
    if (e instanceof MissingRateError) return null;
    throw e;
  }
}

/**
 * 그날 쓴 비용(합계에 넣는 것) — 「62,192원」 / 「¥6,760 · 4건 · 내가 쓴 돈 31,096원」.
 * 기준 화폐가 아닌 통화는 원래 금액으로, 「내가 쓴 돈」 은 일행이 있고 그날 비용이 있을 때만
 */
export function todaySpend(
  expenses: ExpenseWithSplits[],
  date: string,
  ctx: { home: string; rates: ExchangeRates; people: PersonRef[]; me: PersonRef | null },
): SpendView {
  const today = expenses.filter((e) => e.counted && e.spent_on === date);
  const totals = sumExpenses(today, ctx.home, ctx.rates);
  const foreign = Object.entries(totals.byCurrency)
    .filter(([cur]) => cur !== ctx.home)
    .map(([cur, n]) => formatMoney(n, cur));
  const mine =
    ctx.me && ctx.people.length > 1 && today.length > 0
      ? spentByMe(today, ctx.people, ctx.me, ctx.home, ctx.rates)
      : null;
  return {
    total: formatMoney(totals.home, ctx.home),
    sub: [
      ...foreign,
      `${today.length}건`,
      mine === null ? null : `내가 쓴 돈 ${formatMoney(mine, ctx.home)}`,
    ]
      .filter(Boolean)
      .join(" · "),
  };
}

/** 그날 밤 묵는 숙소(체크인 ≤ 그날 < 체크아웃) — 「숙박 2/4박 · 주소」 */
export function tonightStay(stays: Stay[], date: string): { stay: Stay; sub: string } | null {
  const stay = stays.find((s) => s.check_in_date <= date && date < s.check_out_date);
  if (!stay) return null;
  const night = -daysUntil(stay.check_in_date, date) + 1;
  return {
    stay,
    sub: [`숙박 ${night}/${nightsOf(stay)}박`, stay.place.address].filter(Boolean).join(" · "),
  };
}
