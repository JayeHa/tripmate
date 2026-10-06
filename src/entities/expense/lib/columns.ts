import type { ExpenseFormValues } from "../model/schema";
import { personKey, type PersonRef } from "./person";

/** 결제자 두 칸 — 멤버면 payer_id, 정산 인원이면 payer_guest_id, 「각자 냄」 이면 둘 다 null */
function payerColumns(payer: PersonRef | null) {
  return {
    payer_id: payer?.kind === "member" ? payer.id : null,
    payer_guest_id: payer?.kind === "guest" ? payer.id : null,
  };
}

/** 폼이 칸으로 다루는 값 — 수정할 때는 이것만 보낸다. 결제 완료면 예정일을 비운다 */
function formColumns(values: ExpenseFormValues) {
  return {
    name: values.name,
    ...payerColumns(values.payer),
    split_each: values.split_each,
    amount: values.amount,
    currency: values.currency,
    payment_method: values.payment_method,
    category: values.category,
    memo: values.memo || null,
    spent_on: values.spent_on,
    split_mode: values.split_mode,
    schedule_item_id: values.schedule_item_id ?? null,
    counted: values.counted,
    paid: values.paid,
    due_date: values.paid ? null : values.due_date,
  };
}

/** 새 지출의 칸 — 폼에 칸이 없는 환율도 처음 값으로 넣는다 */
export function insertColumns(values: ExpenseFormValues) {
  return { ...formColumns(values), rate: values.rate };
}

/** 함께한 사람을 순서 없이 비교하려고 키를 정렬해 잇는다 */
function participantsKey(values: ExpenseFormValues) {
  return values.participants.map(personKey).sort().join(",");
}

/**
 * 몫이 달라지는 수정인지 — 금액 · 통화 · 함께한 사람 중 하나라도 바뀌었을 때만 나눔 줄을 다시 쓴다.
 * 직접 나누기는 화면에서 뺐다(균등 분할만). 그래서 예전에 직접 나눈 지출도 이 셋을 건드리지 않으면 몫이 그대로 남는다
 */
export function sharesChanged(values: ExpenseFormValues, opened: ExpenseFormValues) {
  return (
    values.amount !== opened.amount ||
    values.currency !== opened.currency ||
    participantsKey(values) !== participantsKey(opened)
  );
}

/**
 * 수정할 때 보낼 칸 — 폼이 칸으로 다루는 값 중 **연 때(`opened`)와 달라진 것만**.
 * 폼이 열려 있는 동안 일행이 바꾼 값(대체 장소 「바꾸기」 의 `counted`, 목록의 「결제 완료로」)을
 * 연 때의 값으로 되돌리지 않으려고. 통화를 바꿨으면 그 지출의 환율은 옛 통화 기준이라 비운다(여행 기본 환율로 돌아간다)
 */
export function updateColumns(values: ExpenseFormValues, opened: ExpenseFormValues) {
  const next = formColumns(values);
  const before = formColumns(opened);
  const changed: Partial<ReturnType<typeof formColumns> & { rate: null }> = Object.fromEntries(
    Object.entries(next).filter(([key, value]) => before[key as keyof typeof before] !== value),
  );
  // 몫을 다시 쓰지 않으면 나눔 방식도 그대로 둔다 — 예전 직접 나누기가 「균등」 으로 표시만 바뀌지 않게
  if (!sharesChanged(values, opened)) delete changed.split_mode;
  if (values.currency !== opened.currency) changed.rate = null;
  return changed;
}
