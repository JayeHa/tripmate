import { type ExpenseCategory, type ExpenseFormValues, personKey } from "@/entities/expense";
import type { Trip } from "@/entities/trip";

type StartOptions = {
  trip: Trip;
  currencies: string[];
  /** 나의 사람 키 */
  me: string;
  initial?: ExpenseFormValues;
  /** 새 지출의 처음 날짜 — ""(여행준비) 또는 yyyy-MM-dd. 없으면 여행 첫날 */
  defaultSpentOn?: string;
};

/**
 * 폼의 처음 값. 수정이면 저장된 값, 새로 추가면 기본값 —
 * 마지막 통화 · 현금 · 결제 완료 · 합계 포함 · 내가 결제 · 모두와 나눔 · 고른 날 또는 여행 첫날.
 * 함께한 사람의 null 은 「모두」 — 사람 목록을 따라간다(기기에 저장된 옛 목록으로 먼저 열려도 새로 읽은 사람이 빠지지 않게).
 * 카테고리는 비워 두고 고르게 한다(필수 칸). 금액은 입력 칸이 다루는 문자열로, 날짜 없음(여행준비 · 예정일)은 빈 글로 바꾼다.
 * 환율은 칸이 없어 처음 값을 들고만 있다
 */
export function startValues({ trip, currencies, me, initial, defaultSpentOn }: StartOptions) {
  if (initial) return savedValues(initial);
  return {
    name: "",
    amount: "",
    currency: currencies[currencies.length - 1],
    rate: null as number | null,
    paymentMethod: "cash" as ExpenseFormValues["payment_method"],
    payer: me as string | null,
    splitEach: false,
    participants: null as string[] | null,
    category: null as ExpenseCategory | null,
    memo: "",
    spentOn: defaultSpentOn ?? trip.start_date,
    itemId: "",
    paid: true,
    dueDate: "",
    counted: true,
  };
}

/** 저장된 지출을 입력 칸 값으로 */
function savedValues(initial: ExpenseFormValues) {
  return {
    name: initial.name,
    amount: String(initial.amount),
    currency: initial.currency,
    rate: initial.rate,
    paymentMethod: initial.payment_method,
    payer: initial.payer ? personKey(initial.payer) : null,
    splitEach: initial.split_each,
    participants: initial.participants.map(personKey) as string[] | null,
    category: initial.category as ExpenseCategory | null,
    memo: initial.memo ?? "",
    spentOn: initial.spent_on ?? "",
    itemId: initial.schedule_item_id ?? "",
    paid: initial.paid,
    dueDate: initial.due_date ?? "",
    counted: initial.counted,
  };
}

export type StartValues = ReturnType<typeof startValues>;
