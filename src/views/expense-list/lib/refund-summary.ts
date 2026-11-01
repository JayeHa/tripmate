import {
  refundCounts,
  type RefundStatus,
  refundStatus,
  refundSums,
  type TaxRefund,
} from "@/entities/tax-refund";
import { formatMoney } from "@/shared/lib/money";

export type RefundSummary = {
  counts: Record<RefundStatus, number>;
  /** 아직 받지 않은 건의 환급 예정액 — 「¥2,883 + ₩1,000」, 금액이 없으면 null */
  expected: string | null;
  /** 받은 건의 환급액 — 같은 모양 */
  received: string | null;
};

/** 통화별 합계를 한 줄로 — 「¥2,883 + ₩1,000」. 비면 null */
function sumsLabel(refunds: TaxRefund[]): string | null {
  const sums = refundSums(refunds);
  return sums.length === 0 ? null : sums.map((s) => formatMoney(s.amount, s.currency)).join(" + ");
}

/** 환급 카드 · 목록 머리의 숫자 — 단계별 건수, 받을 돈 · 받은 돈 */
export function refundSummary(refunds: TaxRefund[]): RefundSummary {
  const received = refunds.filter((r) => refundStatus(r) === "received");
  const pending = refunds.filter((r) => refundStatus(r) !== "received");
  return {
    counts: refundCounts(refunds),
    expected: sumsLabel(pending),
    received: sumsLabel(received),
  };
}
