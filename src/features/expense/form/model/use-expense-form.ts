import { useState } from "react";

import {
  type ExpenseCategory,
  expenseFormSchema,
  type ExpenseFormValues,
  personOfKey,
} from "@/entities/expense";
import type { ScheduleItem } from "@/entities/schedule-item";
import type { Trip } from "@/entities/trip";

import { missingText } from "../lib/missing";
import { splitPreview } from "../lib/split-preview";
import { startValues } from "../lib/start-values";
import { useExpenseLink } from "./use-expense-link";
import { useMoney } from "./use-money";
import { type FormPerson, usePeoplePicker } from "./use-people-picker";

type ExpenseFormOptions = {
  trip: Trip;
  /** 멤버 · 정산 인원. 나를 맨 앞에 둔다 */
  people: FormPerson[];
  me: string;
  /** 연결할 수 있는 일정 — 타임라인 일정과 대체 장소 줄 */
  items: ScheduleItem[];
  alternatives: ScheduleItem[];
  initial?: ExpenseFormValues;
  /** 새 지출의 처음 날짜 — ""(여행준비) 또는 yyyy-MM-dd */
  defaultSpentOn?: string;
  /** 새 지출을 처음부터 이 일정에 연결한다(일정 상세의 「+ 비용」) */
  presetItem?: ScheduleItem | null;
  /** 붙어 있던 영수증이 있다 — 「추가 정보 입력」 을 펼친 채 연다 */
  hasReceipts?: boolean;
  /** 저장 — 수정이면 둘째 값으로 폼을 연 때의 값을 함께 준다(그때와 달라진 칸만 보내려고) */
  onSubmit: (values: ExpenseFormValues, opened: ExpenseFormValues | undefined) => void;
};

/**
 * 비용 입력의 상태와 검증. 화면 조각들은 이 값을 나눠 받아 그리기만 한다.
 * 금액 · 통화 · 환율은 useMoney, 일정 연결은 useExpenseLink 가 쥔다. 금액은 제출할 때 숫자로 바꾼다. 나누기는 균등 분할만 한다
 */
export function useExpenseForm({
  trip,
  people,
  me,
  items,
  alternatives,
  initial,
  defaultSpentOn,
  hasReceipts = false,
  presetItem = null,
  onSubmit,
}: ExpenseFormOptions) {
  const [start] = useState(() =>
    startValues({
      trip,
      currencies: [trip.home_currency, ...Object.keys(trip.exchange_rates)],
      me,
      initial,
      defaultSpentOn,
      presetItem,
    }),
  );
  // 연 때의 값. 열려 있는 동안 지출이 다시 읽혀도(일행이 고침) 바뀌지 않는다
  const [opened] = useState(initial);
  const picker = usePeoplePicker({ people, me, start });
  const [name, setName] = useState(start.name);
  const money = useMoney({ trip, start, opened });
  const { numAmount, homeAmount, currency, home } = money;
  const [paymentMethod, setPaymentMethod] = useState(start.paymentMethod);
  const [category, setCategory] = useState<ExpenseCategory | null>(start.category);
  const [memo, setMemo] = useState(start.memo);
  const [spentOn, setSpentOn] = useState(start.spentOn);
  const [paid, setPaid] = useState(start.paid);
  const [dueDate, setDueDate] = useState(start.dueDate);
  const [counted, setCounted] = useState(start.counted);
  // 접힌 칸에 값이 있으면 펼친 채 연다 — 숨은 값을 모르고 저장하지 않게
  const [moreOpen, setMoreOpen] = useState(
    !!start.memo || !start.paid || !start.counted || hasReceipts,
  );
  const [error, setError] = useState<string | null>(null);
  const link = useExpenseLink({
    trip,
    items,
    alternatives,
    startItemId: start.itemId,
    editing: !!initial,
    // 일정에서 연 비용(presetItem)의 날짜는 그 일정에서 채운 값이라 고른 날짜로 보지 않는다 — 연결을 바꾸면 따라간다
    dayPreset: defaultSpentOn !== undefined,
    fields: {
      spentOn,
      setSpentOn,
      category,
      setCategory,
      name,
      setName,
      setCounted,
      openMore: () => setMoreOpen(true),
    },
  });

  const nameOf = (key: string) => people.find((p) => p.key === key)?.name ?? "알 수 없음";
  const preview = splitPreview({
    amount: homeAmount ?? numAmount,
    currency: homeAmount === null ? currency : home,
    splitEach: picker.splitEach,
    payer: picker.payer,
    participants: picker.participants,
    nameOf,
  });
  const missing = missingText({ amount: numAmount, name: link.effectiveName(), category });

  /** 검증을 통과하면 onSubmit, 아니면 첫 오류를 보인다 */
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (missing) return;
    const parsed = expenseFormSchema.safeParse({
      name: link.effectiveName(),
      amount: numAmount,
      currency,
      rate: money.rate,
      payment_method: paymentMethod,
      payer: picker.payer === null ? null : personOfKey(picker.payer),
      split_each: picker.splitEach,
      participants: picker.participants.flatMap((key) => personOfKey(key) ?? []),
      split_mode: "equal",
      category,
      memo: memo || undefined,
      spent_on: spentOn || null,
      schedule_item_id: link.itemId || null,
      counted,
      paid,
      due_date: paid ? null : dueDate || null,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "입력을 확인하세요");
      return;
    }
    setError(null);
    onSubmit(parsed.data, opened);
  }

  return {
    tripId: trip.id,
    ...money,
    people,
    me,
    picker,
    name,
    setName,
    paymentMethod,
    setPaymentMethod,
    category,
    setCategory: link.pickCategory,
    memo,
    setMemo,
    spentOn,
    setSpentOn: link.pickDay,
    link,
    paid,
    setPaid,
    dueDate,
    setDueDate,
    counted,
    setCounted,
    moreOpen,
    setMoreOpen,
    preview,
    missing,
    error,
    submit,
  };
}

export type ExpenseFormState = ReturnType<typeof useExpenseForm>;
