import { type Expense, paymentStatusText } from "@/entities/expense";
import { formatMoney } from "@/shared/lib/money";

/**
 * 숙소 결제 칸을 열어 달라는 요청 — 숙소 이름(새 비용의 이름) · 붙어 있는 비용(없으면 null → 새로 추가).
 * 비용 입력 창은 다른 기능이라 화면(view)이 연다
 */
export type StayPaymentRequest = { stayId: string; name: string; expenseId: string | null };

/** 결제 요약 한 줄 */
export type StayPaymentView = {
  expenseId: string;
  /** 「¥32,000」 */
  amountText: string;
  /** 「정원 · 결제 완료」 · 「정원 · 11/2 결제 예정」 · 「각자 냄 · 결제 완료」 */
  sub: string;
  /** 결제 예정인데 예정일이 지났다 */
  overdue: boolean;
};

type PayExpense = Pick<Expense, "id" | "amount" | "currency" | "paid" | "due_date" | "split_each">;

/** 숙소에 붙은 비용을 결제 요약으로. payerName 은 결제한 사람 이름(각자 냄이면 무시) */
export function stayPaymentView(e: PayExpense, payerName: string, today: string): StayPaymentView {
  const who = e.split_each ? "각자 냄" : payerName;
  return {
    expenseId: e.id,
    amountText: formatMoney(Number(e.amount), e.currency),
    sub: `${who} · ${paymentStatusText(e.paid, e.due_date)}`,
    overdue: !e.paid && e.due_date !== null && e.due_date < today,
  };
}
