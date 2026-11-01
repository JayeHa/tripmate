import type { ExpenseFormValues } from "../model/schema";
import type { ExpenseCategory, ExpenseWithSplits, PaymentMethod } from "../model/types";
import { payerOf, personKey, splitPerson } from "./person";

/** 저장된 지출을 폼 값으로 — 수정 화면의 처음 값 */
export function formValuesOf(expense: ExpenseWithSplits): ExpenseFormValues {
  const custom = expense.split_mode === "custom";
  return {
    name: expense.name,
    amount: Number(expense.amount),
    currency: expense.currency,
    rate: expense.rate === null ? null : Number(expense.rate),
    payment_method: expense.payment_method as PaymentMethod,
    payer: payerOf(expense),
    split_each: expense.split_each,
    participants: expense.splits.flatMap((s) => splitPerson(s) ?? []),
    split_mode: custom ? "custom" : "equal",
    custom_shares: custom
      ? Object.fromEntries(
          expense.splits.flatMap((s) => {
            const person = splitPerson(s);
            return person ? [[personKey(person), Number(s.share)] as const] : [];
          }),
        )
      : undefined,
    category: expense.category as ExpenseCategory,
    memo: expense.memo ?? undefined,
    spent_on: expense.spent_on,
    spent_time: timeText(expense.spent_time),
    schedule_item_id: expense.schedule_item_id,
    place_id: expense.place_id,
    counted: expense.counted,
    paid: expense.paid,
    due_date: expense.due_date,
  };
}

/** DB 의 시각(「14:20:00」)을 「14:20」 으로. 없으면 null */
export function timeText(time: string | null | undefined): string | null {
  return time ? time.slice(0, 5) : null;
}
