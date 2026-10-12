import { type Expense, type ExpenseDraft, paymentStatusText } from "@/entities/expense";
import { formatMoney } from "@/shared/lib/money";

/**
 * 숙소 결제 칸을 열어 달라는 요청. 비용 입력 창은 다른 기능이라 화면(view)이 연다.
 * - saved: 저장된 숙소 — 숙소 이름(새 비용의 이름) · 붙어 있는 비용(없으면 null → 새로 추가). 창의 「완료」 가 바로 저장한다
 * - draft: 아직 저장하지 않은 새 숙소 — 들고 있는 초안(없으면 null). 창의 「완료」 · 「삭제」 는 onDraft 로 초안만 바꾼다
 */
export type StayPaymentRequest =
  | { kind: "saved"; stayId: string; name: string; expenseId: string | null }
  | {
      kind: "draft";
      name: string;
      draft: ExpenseDraft | null;
      onDraft: (draft: ExpenseDraft | null) => void;
    };

/** 결제 요약 한 줄 */
export type StayPaymentView = {
  /** 「¥32,000」 */
  amountText: string;
  /** 「정원 · 결제 완료」 · 「정원 · 11/2 결제 예정」 · 「각자 냄 · 결제 완료」 */
  sub: string;
  /** 결제 예정인데 예정일이 지났다 */
  overdue: boolean;
};

type PayExpense = Pick<Expense, "amount" | "currency" | "paid" | "due_date" | "split_each">;

/** 숙소에 붙은 비용(또는 초안의 값)을 결제 요약으로. payerName 은 결제한 사람 이름(각자 냄이면 무시) */
export function stayPaymentView(e: PayExpense, payerName: string, today: string): StayPaymentView {
  const who = e.split_each ? "각자 냄" : payerName;
  return {
    amountText: formatMoney(Number(e.amount), e.currency),
    sub: `${who} · ${paymentStatusText(e.paid, e.due_date)}`,
    overdue: !e.paid && e.due_date !== null && e.due_date < today,
  };
}
