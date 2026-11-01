import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";

import {
  REFUND_STATUSES,
  type RefundStatus,
  type RefundSteps,
  type TaxRefund,
} from "../model/types";

/** 단계 이름 — 목록 묶음 머리 */
export const REFUND_STATUS_LABEL: Record<RefundStatus, string> = {
  registered: "세관 확인 전",
  customs: "세관 확인함 · 받을 것",
  received: "받았어요",
};

/** 한 건의 단계 — 받은 시각이 있으면 받음, 세관 확인 시각이 있으면 세관 확인함, 아니면 신청함 */
export function refundStatus(r: RefundSteps): RefundStatus {
  if (r.received_at) return "received";
  if (r.customs_at) return "customs";
  return "registered";
}

/** 구매 순서 — 날짜 · 시각 있는 것 먼저, 같으면 넣은 순 */
function byBought(a: TaxRefund, b: TaxRefund): number {
  const ka = `${a.bought_on ?? "9999"} ${a.bought_time ?? "99"}`;
  const kb = `${b.bought_on ?? "9999"} ${b.bought_time ?? "99"}`;
  return ka.localeCompare(kb) || a.created_at.localeCompare(b.created_at);
}

export type RefundGroup = { status: RefundStatus; items: TaxRefund[] };

/** 단계별 묶음 — 세관 확인 전 → 받을 것 → 받았어요, 빈 묶음은 뺀다. 묶음 안은 구매 순 */
export function refundGroups(refunds: TaxRefund[]): RefundGroup[] {
  return REFUND_STATUSES.map((status) => ({
    status,
    items: refunds.filter((r) => refundStatus(r) === status).toSorted(byBought),
  })).filter((g) => g.items.length > 0);
}

/** 단계별 건수 */
export function refundCounts(refunds: TaxRefund[]): Record<RefundStatus, number> {
  const counts = { registered: 0, customs: 0, received: 0 };
  for (const r of refunds) counts[refundStatus(r)] += 1;
  return counts;
}

export type RefundSum = { currency: string; amount: number };

/** 환급 예정액 합계 — 통화마다, 처음 나온 순서. 금액 없는 건은 뺀다 */
export function refundSums(refunds: TaxRefund[]): RefundSum[] {
  const sums = new Map<string, number>();
  for (const r of refunds) {
    if (r.refund_amount === null) continue;
    sums.set(r.currency, (sums.get(r.currency) ?? 0) + Number(r.refund_amount));
  }
  return [...sums].map(([currency, amount]) => ({ currency, amount }));
}

/** 「11.1 (일) 20:03」 — 날짜가 없으면 null, 시각이 없으면 날짜만 */
export function boughtLabel(r: Pick<TaxRefund, "bought_on" | "bought_time">): string | null {
  if (!r.bought_on) return null;
  const date = format(parseISO(r.bought_on), "M.d (EEE)", { locale: ko });
  return r.bought_time ? `${date} ${r.bought_time.slice(0, 5)}` : date;
}

/**
 * 새 건의 처음 통화 — 마지막에 고친 건의 통화(지금도 여행 통화일 때) → 첫 외화 → 기준 통화.
 * 환급은 현지 돈이라 외화를 먼저 고른다
 */
export function startRefundCurrency(currencies: string[], refunds: TaxRefund[]): string {
  const last = refunds
    .filter((r) => currencies.includes(r.currency))
    .toSorted((a, b) => b.updated_at.localeCompare(a.updated_at))[0];
  return last?.currency ?? currencies[1] ?? currencies[0];
}

/**
 * 단계를 바꿀 칸 — 「세관 확인했어요」 는 customs_at 만, 「받았어요」 는 둘 다(세관 확인이 비었으면 같은 시각으로),
 * 세관 확인 되돌리기는 둘 다 비우고, 받음 되돌리기는 received_at 만 비운다
 */
export function stepPatch(r: RefundSteps, to: RefundStatus, now: string): RefundSteps {
  if (to === "registered") return { customs_at: null, received_at: null };
  if (to === "customs") return { customs_at: r.customs_at ?? now, received_at: null };
  return { customs_at: r.customs_at ?? now, received_at: r.received_at ?? now };
}
