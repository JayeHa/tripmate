import { type RefundStatus, refundStatus, type TaxRefund } from "@/entities/tax-refund";

/** 공항에서 할 일 — 세관 확인(아직 신청만 한 건) · 현금 받기(세관 확인을 마친 공항 현금 건) */
export type DepartureStep = Extract<RefundStatus, "customs" | "received">;

export type DepartureRefund = { refund: TaxRefund; step: DepartureStep };

export type DepartureRefunds = {
  rows: DepartureRefund[];
  /** 세관 확인 전 건수 */
  customsLeft: number;
  /** 공항 현금 건이 있다 — 「카운터에서 받아요」 안내를 더한다 */
  hasCash: boolean;
};

/** 한 건의 공항 할 일 — 없으면 null(카드 환급은 세관 확인 뒤 기다리기만, 받았으면 끝) */
export function departureStep(r: TaxRefund): DepartureStep | null {
  const status = refundStatus(r);
  if (status === "registered") return "customs";
  if (status === "customs" && r.method === "cash") return "received";
  return null;
}

/**
 * 출국 날 홈 「면세 환급」 카드에 그릴 것 — 여행 마지막 날이고 공항에서 할 일이 남은 건이 있을 때만(아니면 null).
 * 세관 확인 전 건을 먼저, 그다음 현금 받을 건. 같은 단계는 구매 순
 */
export function departureRefunds(refunds: TaxRefund[], lastDay: boolean): DepartureRefunds | null {
  if (!lastDay) return null;
  const rows = refunds
    .flatMap((refund): DepartureRefund[] => {
      const step = departureStep(refund);
      return step ? [{ refund, step }] : [];
    })
    .toSorted(
      (a, b) =>
        Number(a.step === "received") - Number(b.step === "received") ||
        `${a.refund.bought_on ?? ""} ${a.refund.bought_time ?? ""}`.localeCompare(
          `${b.refund.bought_on ?? ""} ${b.refund.bought_time ?? ""}`,
        ),
    );
  if (rows.length === 0) return null;
  return {
    rows,
    customsLeft: rows.filter((r) => r.step === "customs").length,
    hasCash: rows.some((r) => r.refund.method === "cash"),
  };
}
