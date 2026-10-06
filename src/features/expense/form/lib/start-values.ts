import { type ExpenseFormValues, personKey } from "@/entities/expense";
import type { Trip } from "@/entities/trip";

export type SplitMode = ExpenseFormValues["split_mode"];

/** 이 폼이 칸으로 다루지 않고 그대로 들고 있다가 저장하는 값 — 환율 · 결제수단 · 합계 포함 · 결제 상태 */
export type KeptValues = Pick<
  ExpenseFormValues,
  "rate" | "payment_method" | "counted" | "paid" | "due_date"
>;

type StartOptions = {
  trip: Trip;
  currencies: string[];
  /** 고를 수 있는 사람 키(멤버 · 정산 인원). `personKey` 로 만든다 */
  memberIds: string[];
  currentUserId: string;
  initial?: ExpenseFormValues;
  /** 새 지출의 처음 날짜 — ""(여행준비) 또는 yyyy-MM-dd. 없으면 여행 첫날 */
  defaultSpentOn?: string;
};

const KEPT_DEFAULTS: KeptValues = {
  rate: null,
  payment_method: "cash",
  counted: true,
  paid: true,
  due_date: null,
};

/**
 * 폼의 처음 값. 수정이면 저장된 값, 새로 추가면 기본값(마지막 통화 · 내가 결제 · 모두 나눔 · 식비 · 고른 날 또는 여행 첫날).
 * 숫자는 입력 칸이 다루는 문자열로, 날짜는 여행준비(null)를 빈 글로 바꾼다.
 */
export function startValues({
  trip,
  currencies,
  memberIds,
  currentUserId,
  initial,
  defaultSpentOn,
}: StartOptions) {
  if (initial) return savedValues(initial);
  return {
    name: "",
    amount: "",
    currency: currencies[currencies.length - 1],
    payerId: currentUserId,
    participants: memberIds,
    splitMode: "equal" as SplitMode,
    custom: {} as Record<string, string>,
    category: "food" as ExpenseFormValues["category"],
    memo: "",
    spentOn: defaultSpentOn ?? trip.start_date,
    itemId: "",
    kept: KEPT_DEFAULTS,
  };
}

/** 저장된 지출을 입력 칸 값으로 */
function savedValues(initial: ExpenseFormValues) {
  return {
    name: initial.name,
    amount: String(initial.amount),
    currency: initial.currency,
    payerId: initial.payer ? personKey(initial.payer) : "",
    participants: initial.participants.map(personKey),
    splitMode: initial.split_mode,
    custom: Object.fromEntries(
      Object.entries(initial.custom_shares ?? {}).map(([k, v]) => [k, String(v)]),
    ),
    category: initial.category,
    memo: initial.memo ?? "",
    spentOn: initial.spent_on ?? "",
    itemId: initial.schedule_item_id ?? "",
    kept: {
      rate: initial.rate,
      payment_method: initial.payment_method,
      counted: initial.counted,
      paid: initial.paid,
      due_date: initial.due_date,
    } satisfies KeptValues,
  };
}
