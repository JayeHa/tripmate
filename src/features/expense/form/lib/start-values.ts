import {
  type ExpenseCategory,
  type ExpenseFormValues,
  type PayFor,
  PAYMENT_OWNER,
  personKey,
} from "@/entities/expense";
import type { ScheduleItem } from "@/entities/schedule-item";
import type { Trip } from "@/entities/trip";
import { dayIndexToDate } from "@/shared/lib/days";

import { expenseCategoryOf } from "./link-items";

type StartOptions = {
  trip: Trip;
  currencies: string[];
  /** 나의 사람 키 */
  me: string;
  initial?: ExpenseFormValues;
  /** 새 지출의 처음 날짜 — ""(여행준비) 또는 yyyy-MM-dd. 없으면 여행 첫날 */
  defaultSpentOn?: string;
  /** 새 지출을 처음부터 이 일정에 연결한다(일정 상세의 「+ 비용」) — 날짜 · 카테고리 · 합계 포함을 그 일정에 맞춘다 */
  presetItem?: ScheduleItem | null;
  /** 새 지출의 처음 통화(startCurrency) */
  defaultCurrency?: string;
  /** 새 지출의 처음 금액(입력 칸 문자열) — 여행 홈 환율 계산기에서 연 비용 */
  defaultAmount?: string;
  /** 숙소 · 항공편 결제로 연 새 지출 — 그 이름 · 카테고리(숙소 · 항공)로 시작한다(DB 도 그쪽에 맞춘다) */
  payFor?: PayFor;
};

/**
 * 폼의 처음 값. 수정이면 저장된 값, 새로 추가면 기본값 —
 * 처음 통화(없으면 첫 외화) · 현금 · 결제 완료 · 합계 포함 · 내가 결제 · 모두와 나눔 · 고른 날 또는 여행 첫날.
 * 함께한 사람의 null 은 「모두」 — 사람 목록을 따라간다(기기에 저장된 옛 목록으로 먼저 열려도 새로 읽은 사람이 빠지지 않게).
 * 카테고리는 비워 두고 고르게 한다(필수 칸). 금액은 입력 칸이 다루는 문자열로, 날짜 없음(여행준비 · 예정일)은 빈 글로 바꾼다.
 * 환율은 칸이 없어 처음 값을 들고만 있다
 */
export function startValues({
  trip,
  currencies,
  me,
  initial,
  defaultSpentOn,
  presetItem,
  defaultCurrency,
  defaultAmount,
  payFor,
}: StartOptions) {
  if (initial) return savedValues(initial);
  const blank = {
    ...newValues(trip, defaultCurrency ?? currencies[1] ?? currencies[0], me, defaultSpentOn),
    amount: defaultAmount ?? "",
  };
  if (payFor) return { ...blank, name: payFor.name, category: PAYMENT_OWNER[payFor.kind].category };
  if (!presetItem) return blank;
  // 일정에서 연 새 지출 — 그 일정의 날 · 카테고리(일정 종류로), 대체 장소면 합계에서 뺀다(연결할 때와 같은 규칙)
  return {
    ...blank,
    itemId: presetItem.id,
    spentOn: dayIndexToDate(trip.start_date, presetItem.day_index),
    category: expenseCategoryOf(presetItem),
    counted: presetItem.alternative_of === null,
  };
}

/** 새 지출의 기본값 */
function newValues(trip: Trip, currency: string, me: string, defaultSpentOn?: string) {
  return {
    name: "",
    amount: "",
    currency,
    rate: null as number | null,
    // 여행지에서 대부분 카드로 낸다(2026-10-31 사용자 결정, #286)
    paymentMethod: "card" as ExpenseFormValues["payment_method"],
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
