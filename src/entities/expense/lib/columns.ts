import type { ExpenseFormValues } from "../model/schema";
import type { PersonRef } from "./person";

/** 결제자 두 칸 — 멤버면 payer_id, 정산 인원이면 payer_guest_id, 「각자 냄」 이면 둘 다 null */
function payerColumns(payer: PersonRef | null) {
  return {
    payer_id: payer?.kind === "member" ? payer.id : null,
    payer_guest_id: payer?.kind === "guest" ? payer.id : null,
  };
}

/** 폼이 칸으로 다루는 값 — 수정할 때는 이것만 보낸다 */
function formColumns(values: ExpenseFormValues) {
  return {
    name: values.name,
    ...payerColumns(values.payer),
    split_each: values.split_each,
    amount: values.amount,
    currency: values.currency,
    category: values.category,
    memo: values.memo || null,
    spent_on: values.spent_on,
    split_mode: values.split_mode,
    schedule_item_id: values.schedule_item_id ?? null,
  };
}

/** 새 지출의 칸 — 폼이 다루지 않는 값(환율 · 결제수단 · 합계 포함 · 결제 상태)도 처음 값으로 넣는다 */
export function insertColumns(values: ExpenseFormValues) {
  return {
    ...formColumns(values),
    rate: values.rate,
    payment_method: values.payment_method,
    counted: values.counted,
    paid: values.paid,
    due_date: values.paid ? null : values.due_date,
  };
}

/**
 * 수정할 때 보낼 칸 — 폼이 칸으로 다루는 값만. 칸이 없는 값을 폼을 연 때의 값으로 다시 쓰면,
 * 그 사이 서버가 바꾼 값(대체 장소 「바꾸기」 의 `counted`)을 되돌린다.
 * 통화를 바꿨으면 그 지출의 환율은 옛 통화 기준이라 비운다(여행 기본 환율로 돌아간다)
 */
export function updateColumns(values: ExpenseFormValues, previousCurrency: string) {
  const columns = formColumns(values);
  return values.currency === previousCurrency ? columns : { ...columns, rate: null };
}
