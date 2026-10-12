import { formatMoney } from "@/shared/lib/money";

import type { Expense } from "../model/types";
import { paymentStatusText } from "./detail-text";

/** 결제 요약 한 줄 — 숙소 · 항공편에 붙은 비용(결제) */
export type PaymentView = {
  /** 「¥32,000」 */
  amountText: string;
  /** 「정원 · 결제 완료」 · 「정원 · 11/2 결제 예정」 · 「각자 냄 · 결제 완료」 */
  sub: string;
  /** 결제 예정인데 예정일이 지났다 */
  overdue: boolean;
};

type PayExpense = Pick<Expense, "amount" | "currency" | "paid" | "due_date" | "split_each">;

/** 붙어 있는 비용(또는 초안의 값)을 결제 요약으로. payerName 은 결제한 사람 이름(각자 냄이면 무시) */
export function paymentView(e: PayExpense, payerName: string, today: string): PaymentView {
  const who = e.split_each ? "각자 냄" : payerName;
  return {
    amountText: formatMoney(Number(e.amount), e.currency),
    sub: `${who} · ${paymentStatusText(e.paid, e.due_date)}`,
    overdue: !e.paid && e.due_date !== null && e.due_date < today,
  };
}
