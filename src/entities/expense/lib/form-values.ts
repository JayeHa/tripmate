import type { ExpenseFormValues } from "../model/schema";
import type { ExpenseCategory, ExpenseWithSplits, PaymentMethod } from "../model/types";

/** 저장된 지출을 폼 값으로 — 수정 화면의 처음 값 */
export function formValuesOf(expense: ExpenseWithSplits): ExpenseFormValues {
  const custom = expense.split_mode === "custom";
  return {
    name: expense.name,
    amount: Number(expense.amount),
    currency: expense.currency,
    rate: expense.rate === null ? null : Number(expense.rate),
    payment_method: expense.payment_method as PaymentMethod,
    payer_id: expense.payer_id,
    participant_ids: expense.splits.map((s) => s.user_id),
    split_mode: custom ? "custom" : "equal",
    custom_shares: custom
      ? Object.fromEntries(expense.splits.map((s) => [s.user_id, Number(s.share)]))
      : undefined,
    category: expense.category as ExpenseCategory,
    memo: expense.memo ?? undefined,
    spent_on: expense.spent_on,
    schedule_item_id: expense.schedule_item_id,
    counted: expense.counted,
    paid: expense.paid,
    due_date: expense.due_date,
  };
}
