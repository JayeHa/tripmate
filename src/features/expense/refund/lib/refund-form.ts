import { format } from "date-fns";
import { ko } from "date-fns/locale";

import {
  boughtLabel,
  REFUND_METHOD_LABEL,
  REFUND_METHODS,
  type RefundMethod,
  type TaxRefund,
  type TaxRefundFields,
} from "@/entities/tax-refund";
import { amountDraft, formatMoney, parseAmount } from "@/shared/lib/money";

/** 칸 길이 — DB check 와 같다(0077) */
export const STORE_MAX = 60;
export const PROVIDER_MAX = 40;
export const SITE_URL_MAX = 500;
export const TRANSACTION_MAX = 60;
export const METHOD_NOTE_MAX = 60;
export const MEMO_MAX = 500;

/** 폼의 입력 상태 — 금액은 친 글자 그대로 */
export type RefundDraft = {
  store: string;
  provider: string;
  siteUrl: string;
  transactionId: string;
  boughtOn: string;
  boughtTime: string;
  currency: string;
  amount: string;
  refundAmount: string;
  method: RefundMethod;
  methodNote: string;
  memo: string;
};

/** 저장된 방법 → 폼 값. 모르는 값이면 카드 */
function methodOf(value: string): RefundMethod {
  return REFUND_METHODS.find((m) => m === value) ?? "card";
}

/** 폼의 처음 값 — 고치는 건이면 그 값, 새 건이면 오늘 · 시작 통화 · 카드 */
export function draftOf(
  refund: TaxRefund | null,
  startCurrency: string,
  today: string,
): RefundDraft {
  if (!refund) {
    return {
      store: "",
      provider: "",
      siteUrl: "",
      transactionId: "",
      boughtOn: today,
      boughtTime: "",
      currency: startCurrency,
      amount: "",
      refundAmount: "",
      method: "card",
      methodNote: "",
      memo: "",
    };
  }
  return {
    store: refund.store,
    provider: refund.provider ?? "",
    siteUrl: refund.site_url ?? "",
    transactionId: refund.transaction_id ?? "",
    boughtOn: refund.bought_on ?? "",
    boughtTime: refund.bought_time?.slice(0, 5) ?? "",
    currency: refund.currency,
    amount: amountDraft(refund.amount),
    refundAmount: amountDraft(refund.refund_amount),
    method: methodOf(refund.method),
    methodNote: refund.method_note ?? "",
    memo: refund.memo ?? "",
  };
}

/** 앞뒤 공백을 떼고 비면 null */
const text = (s: string) => s.trim() || null;

/** 폼 값 → 저장할 칸. 시각은 날짜가 있을 때만(DB check) */
export function fieldsOf(d: RefundDraft): TaxRefundFields {
  return {
    store: d.store.trim(),
    provider: text(d.provider),
    site_url: text(d.siteUrl),
    transaction_id: text(d.transactionId),
    bought_on: d.boughtOn || null,
    bought_time: d.boughtOn && d.boughtTime ? d.boughtTime : null,
    currency: d.currency,
    amount: parseAmount(d.amount, d.currency),
    refund_amount: parseAmount(d.refundAmount, d.currency),
    method: d.method,
    method_note: text(d.methodNote),
    memo: text(d.memo),
  };
}

/** 저장할 수 있나 — 매장만 있으면 된다 */
export function canSaveDraft(d: RefundDraft): boolean {
  return d.store.trim().length > 0;
}

/** 「카드 · 쿠팡 와우카드」 — 방법과 방법 메모 */
export function methodText(r: Pick<TaxRefund, "method" | "method_note">): string {
  const label = REFUND_METHOD_LABEL[methodOf(r.method)];
  return r.method_note ? `${label} · ${r.method_note}` : label;
}

/** 단계 시각 — 「11.4 (수) 10:20」(기기 시간대) */
export function stepTimeLabel(iso: string): string {
  return format(new Date(iso), "M.d (EEE) HH:mm", { locale: ko });
}

export type DetailRow = { label: string; value: string | null; href?: string };

/** 상세의 정보 표 — 사업자 · 환급 방법 · 구매 · 금액 · 환급 예정 · 거래번호 · 신청 사이트 · 메모(비면 「없음」) */
export function detailRows(r: TaxRefund): DetailRow[] {
  const site = r.site_url?.trim() || null;
  return [
    { label: "사업자", value: r.provider },
    { label: "환급 방법", value: methodText(r) },
    { label: "구매", value: boughtLabel(r) },
    { label: "구매 금액", value: r.amount === null ? null : formatMoney(r.amount, r.currency) },
    {
      label: "환급 예정",
      value: r.refund_amount === null ? null : formatMoney(r.refund_amount, r.currency),
    },
    { label: "거래번호", value: r.transaction_id },
    {
      label: "신청 사이트",
      value: site,
      href: site && /^https?:\/\//i.test(site) ? site : undefined,
    },
    { label: "메모", value: r.memo },
  ];
}
