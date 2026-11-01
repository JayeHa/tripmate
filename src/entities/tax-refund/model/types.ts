import type { Tables } from "@/shared/api/supabase/database.types";

/** 택스 리펀 한 건(0077) — 매장 · 사업자 · 금액 · 환급 방법 · 세관 확인 · 받음 */
export type TaxRefund = Tables<"tax_refunds">;

/** 환급 방법 — 이 순서로 고르기 칸에 보인다. 매장(사업자)마다 달라 건마다 적는다 */
export const REFUND_METHODS = ["card", "cash", "app", "bank"] as const;
export type RefundMethod = (typeof REFUND_METHODS)[number];

export const REFUND_METHOD_LABEL: Record<RefundMethod, string> = {
  card: "카드",
  cash: "공항 현금",
  app: "앱 · 페이",
  bank: "계좌",
};

/** 자주 쓰는 환급 사업자 — 폼의 칩. 없는 사업자는 직접 적는다 */
export const REFUND_PROVIDERS = ["J-TaxRefund", "JPrefund", "Global Blue", "Smart Detax"] as const;

/** 단계 — 신청함 → 세관 확인함 → 받았어요. 칸 둘(customs_at · received_at)로 정해진다 */
export const REFUND_STATUSES = ["registered", "customs", "received"] as const;
export type RefundStatus = (typeof REFUND_STATUSES)[number];

/** 폼이 저장하는 칸 — 여행 · 단계 · 만든 사람 · 시각은 빼고 */
export type TaxRefundFields = Pick<
  TaxRefund,
  | "store"
  | "provider"
  | "site_url"
  | "transaction_id"
  | "bought_on"
  | "bought_time"
  | "currency"
  | "amount"
  | "refund_amount"
  | "method"
  | "method_note"
  | "memo"
  | "owner_id"
  | "barcode"
>;

/** 단계 칸 — 「받았어요」 는 세관 확인도 함께, 세관 확인을 되돌리면 받았어요도 함께 비운다(DB check) */
export type RefundSteps = Pick<TaxRefund, "customs_at" | "received_at">;
