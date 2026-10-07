import { useMemo, useState } from "react";

import {
  type ExpenseCategory,
  expenseFormSchema,
  type ExpenseFormValues,
  personOfKey,
} from "@/entities/expense";
import type { ScheduleItem } from "@/entities/schedule-item";
import type { Trip } from "@/entities/trip";
import { decimalsOf } from "@/shared/lib/money";

import { cleanAmount, fitAmountDraft } from "../lib/amount-draft";
import { missingText } from "../lib/missing";
import { homeAmountOrNull, rateLine } from "../lib/rate-line";
import { splitPreview } from "../lib/split-preview";
import { startValues } from "../lib/start-values";
import { useExpenseLink } from "./use-expense-link";
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
  /** 저장 — 수정이면 둘째 값으로 폼을 연 때의 값을 함께 준다(그때와 달라진 칸만 보내려고) */
  onSubmit: (values: ExpenseFormValues, opened: ExpenseFormValues | undefined) => void;
};

/**
 * 비용 입력의 상태와 검증. 화면 조각들은 이 값을 나눠 받아 그리기만 한다.
 * 금액은 입력 중인 문자열로 들고 제출할 때 숫자로 바꾼다. 일정 연결은 useExpenseLink 가 쥔다.
 * 통화를 바꾸면 이 지출에만 적은 환율을 비운다(옛 통화 기준이라). 나누기는 균등 분할만 한다
 */
export function useExpenseForm({
  trip,
  people,
  me,
  items,
  alternatives,
  initial,
  defaultSpentOn,
  onSubmit,
}: ExpenseFormOptions) {
  const currencies = useMemo(
    () => [trip.home_currency, ...Object.keys(trip.exchange_rates)],
    [trip],
  );
  const [start] = useState(() =>
    startValues({
      trip,
      currencies,
      me,
      initial,
      defaultSpentOn,
    }),
  );
  // 연 때의 값. 열려 있는 동안 지출이 다시 읽혀도(일행이 고침) 바뀌지 않는다
  const [opened] = useState(initial);
  const picker = usePeoplePicker({ people, me, start });
  const [name, setName] = useState(start.name);
  const [amount, setAmountDraft] = useState(start.amount);
  const [currency, setCurrencyState] = useState(start.currency);
  const [rate, setRate] = useState(start.rate);
  const [paymentMethod, setPaymentMethod] = useState(start.paymentMethod);
  const [category, setCategory] = useState<ExpenseCategory | null>(start.category);
  const [memo, setMemo] = useState(start.memo);
  const [spentOn, setSpentOn] = useState(start.spentOn);
  const [paid, setPaid] = useState(start.paid);
  const [dueDate, setDueDate] = useState(start.dueDate);
  const [counted, setCounted] = useState(start.counted);
  // 접힌 칸에 값이 있으면 펼친 채 연다 — 숨은 값을 모르고 저장하지 않게
  const [moreOpen, setMoreOpen] = useState(!!start.memo || !start.paid || !start.counted);
  const [error, setError] = useState<string | null>(null);
  const link = useExpenseLink({
    trip,
    items,
    alternatives,
    startItemId: start.itemId,
    editing: !!initial,
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

  const decimals = decimalsOf(currency);
  const numAmount = Number(amount) || 0;
  const home = trip.home_currency;
  const homeAmount = homeAmountOrNull(numAmount, currency, rate, home, trip.exchange_rates);
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

  /** 입력한 글을 이 통화의 금액 초안으로 */
  function setAmount(input: string) {
    setAmountDraft(cleanAmount(input, decimals));
  }

  /**
   * 통화를 바꾸고, 금액의 소수부를 새 통화에 맞춰 자른다. 이 지출 환율은 옛 통화 기준이라 비우되,
   * 연 때의 통화로 돌아오면 연 때의 환율을 되살린다 — 화면의 「엔 920 기준」 과 저장되는 환율이 어긋나지 않게
   */
  function setCurrency(next: string) {
    setCurrencyState(next);
    setAmountDraft((draft) => fitAmountDraft(draft, decimalsOf(next)));
    setRate(next === opened?.currency ? opened.rate : null);
  }

  /** 검증을 통과하면 onSubmit, 아니면 첫 오류를 보인다 */
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (missing) return;
    const parsed = expenseFormSchema.safeParse({
      name: link.effectiveName(),
      amount: numAmount,
      currency,
      rate,
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
    currencies,
    people,
    me,
    picker,
    home,
    name,
    setName,
    amount,
    setAmount,
    numAmount,
    homeAmount,
    rateText: rateLine(currency, home, trip.exchange_rates, rate),
    currency,
    setCurrency,
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
