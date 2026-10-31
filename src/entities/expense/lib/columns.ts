import type { ExpenseFormValues } from "../model/schema";
import { personKey, type PersonRef } from "./person";

/** 결제자 두 칸 — 멤버면 payer_id, 정산 인원이면 payer_guest_id, 「각자 냄」 이면 둘 다 null */
function payerColumns(payer: PersonRef | null) {
  return {
    payer_id: payer?.kind === "member" ? payer.id : null,
    payer_guest_id: payer?.kind === "guest" ? payer.id : null,
  };
}

/**
 * 폼이 다루는 값 — 수정할 때는 이 중 달라진 것만 보낸다. 결제 완료면 예정일을 비운다.
 * 환율은 칸이 아직 없지만 폼이 들고 있다(통화를 바꾸면 비우고, 연 때의 통화로 돌아오면 되살린다)
 */
function formColumns(values: ExpenseFormValues) {
  return {
    name: values.name,
    ...payerColumns(values.payer),
    split_each: values.split_each,
    amount: values.amount,
    currency: values.currency,
    rate: values.rate,
    payment_method: values.payment_method,
    category: values.category,
    memo: values.memo || null,
    spent_on: values.spent_on,
    // 여행준비(쓴 날 없음)에는 시각이 없다
    spent_time: values.spent_on ? (values.spent_time ?? null) : null,
    split_mode: values.split_mode,
    schedule_item_id: values.schedule_item_id ?? null,
    // 일정을 연결한 비용은 그 일정의 장소를 쓴다
    place_id: values.schedule_item_id ? null : (values.place_id ?? null),
    counted: values.counted,
    paid: values.paid,
    due_date: values.paid ? null : values.due_date,
  };
}

/** 새 지출의 칸 */
export function insertColumns(values: ExpenseFormValues) {
  return formColumns(values);
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
 * DB 제약으로 묶인 칸 — 하나라도 달라지면 묶음 전체를 보낸다. 일부만 보내면 그사이 일행이 묶음의 다른 칸을 바꿨을 때
 * 제약에 걸린다(결제자 셋은 `expenses_payer_chk`, 결제 상태 둘은 `expenses_due_date_chk`)
 */
const COLUMN_GROUPS = [
  ["payer_id", "payer_guest_id", "split_each"],
  ["paid", "due_date"],
] as const;

/**
 * 수정할 때 보낼 칸 — 폼이 다루는 값 중 **연 때(`opened`)와 달라진 것만**. 제약으로 묶인 칸은 묶음 단위로(`COLUMN_GROUPS`).
 * 폼이 열려 있는 동안 일행이 바꾼 값(대체 장소 「바꾸기」 의 `counted`, 목록의 「결제 완료로」)을
 * 연 때의 값으로 되돌리지 않으려고.
 * 몫을 다시 쓰는 수정이면(`sharesChanged`) 금액 · 통화 · 환율 · 나눔 방식을 한 묶음으로 보낸다 — 몫은 이 금액 기준이라,
 * 그사이 일행이 금액을 바꿨어도 줄의 금액과 몫의 합이 어긋나지 않게. 아니면 나눔 방식은 그대로 둔다(예전 직접 나누기)
 */
export function updateColumns(values: ExpenseFormValues, opened: ExpenseFormValues) {
  const next = formColumns(values);
  const before = formColumns(opened);
  const changed: Partial<typeof next> = Object.fromEntries(
    Object.entries(next).filter(([key, value]) => before[key as keyof typeof before] !== value),
  );
  for (const group of COLUMN_GROUPS) {
    if (!group.some((key) => key in changed)) continue;
    for (const key of group) Object.assign(changed, { [key]: next[key] });
  }
  if (!sharesChanged(values, opened)) {
    delete changed.split_mode;
    return changed;
  }
  const { amount, currency, rate, split_mode } = next;
  return { ...changed, amount, currency, rate, split_mode };
}
