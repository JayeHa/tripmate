import { useMemo, useState } from "react";

import { expenseFormSchema, type ExpenseFormValues } from "@/entities/expense";
import type { Trip } from "@/entities/trip";
import type { TripMember } from "@/entities/trip-member";
import { decimalsOf, splitEqual, validateCustomShares } from "@/shared/lib/money";

export type SplitMode = ExpenseFormValues["split_mode"];

type ExpenseFormOptions = {
  trip: Trip;
  members: TripMember[];
  currentUserId: string;
  initial?: ExpenseFormValues;
  onSubmit: (values: ExpenseFormValues) => void;
};

type StartOptions = {
  trip: Trip;
  currencies: string[];
  memberIds: string[];
  currentUserId: string;
  initial?: ExpenseFormValues;
};

/**
 * 폼의 처음 값. 수정이면 저장된 값, 새로 추가면 기본값(마지막 통화 · 내가 결제 · 모두 나눔 · 식비 · 여행 첫날).
 * 숫자는 입력 칸이 다루는 문자열로 바꾼다.
 */
function startValues({ trip, currencies, memberIds, currentUserId, initial }: StartOptions) {
  if (initial) return savedValues(initial);
  return {
    amount: "",
    currency: currencies[currencies.length - 1],
    payerId: currentUserId,
    participants: memberIds,
    splitMode: "equal" as SplitMode,
    custom: {} as Record<string, string>,
    category: "food" as ExpenseFormValues["category"],
    memo: "",
    spentOn: trip.start_date,
    itemId: "",
  };
}

/** 저장된 지출을 입력 칸 값으로 */
function savedValues(initial: ExpenseFormValues) {
  return {
    amount: String(initial.amount),
    currency: initial.currency,
    payerId: initial.payer_id,
    participants: initial.participant_ids,
    splitMode: initial.split_mode,
    custom: Object.fromEntries(
      Object.entries(initial.custom_shares ?? {}).map(([k, v]) => [k, String(v)]),
    ),
    category: initial.category,
    memo: initial.memo ?? "",
    spentOn: initial.spent_on,
    itemId: initial.schedule_item_id ?? "",
  };
}

/**
 * 지출 입력의 상태와 검증. 화면 조각들은 이 값을 나눠 받아 그리기만 한다.
 * 금액 · 직접 나눈 몫은 입력 중인 문자열로 들고, 제출할 때 숫자로 바꾼다.
 * 날짜를 바꾸면 연결 일정을 비운다(그날 일정에서만 고른다).
 */
export function useExpenseForm({
  trip,
  members,
  currentUserId,
  initial,
  onSubmit,
}: ExpenseFormOptions) {
  const currencies = useMemo(
    () => [trip.home_currency, ...Object.keys(trip.exchange_rates)],
    [trip],
  );
  const memberIds = members.map((m) => m.user_id);

  const [start] = useState(() =>
    startValues({ trip, currencies, memberIds, currentUserId, initial }),
  );
  const [amount, setAmount] = useState(start.amount);
  const [currency, setCurrency] = useState(start.currency);
  const [payerId, setPayerId] = useState(start.payerId);
  const [participants, setParticipants] = useState<string[]>(start.participants);
  const [splitMode, setSplitMode] = useState<SplitMode>(start.splitMode);
  const [custom, setCustom] = useState<Record<string, string>>(start.custom);
  const [category, setCategory] = useState<ExpenseFormValues["category"]>(start.category);
  const [memo, setMemo] = useState(start.memo);
  const [spentOn, setSpentOnState] = useState(start.spentOn);
  const [itemId, setItemId] = useState<string>(start.itemId);
  const [error, setError] = useState<string | null>(null);

  const numAmount = Number(amount) || 0;
  const decimals = decimalsOf(currency);

  const equalPreview = useMemo(() => {
    if (numAmount <= 0 || participants.length === 0) return null;
    return splitEqual(numAmount, currency, participants);
  }, [numAmount, currency, participants]);

  const customSum = participants.reduce((acc, id) => acc + (Number(custom[id]) || 0), 0);
  const customDiff = Math.round((numAmount - customSum) * 10 ** decimals) / 10 ** decimals;

  /** 나눌 사람에 넣거나 뺀다 */
  function toggleParticipant(id: string) {
    setParticipants((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  /** 모두 선택돼 있으면 모두 해제, 아니면 모두 선택 */
  function toggleAllParticipants() {
    setParticipants((p) => (p.length === memberIds.length ? [] : memberIds));
  }

  /** 날짜를 바꾸고 연결 일정을 비운다 */
  function setSpentOn(date: string) {
    setSpentOnState(date);
    setItemId("");
  }

  /** 직접 나눈 몫을 숫자로. 나눌 사람만 */
  function customShares() {
    return Object.fromEntries(participants.map((id) => [id, Number(custom[id]) || 0]));
  }

  /** 검증을 통과하면 onSubmit, 아니면 첫 오류를 보인다 */
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = expenseFormSchema.safeParse({
      amount: numAmount,
      currency,
      payer_id: payerId,
      participant_ids: participants,
      split_mode: splitMode,
      custom_shares: splitMode === "custom" ? customShares() : undefined,
      category,
      memo: memo || undefined,
      spent_on: spentOn,
      schedule_item_id: itemId || null,
    } satisfies ExpenseFormValues);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "입력을 확인하세요");
      return;
    }
    const shares = splitMode === "custom" ? validateCustom() : null;
    if (shares && !shares.ok) {
      setError(shares.error);
      return;
    }
    setError(null);
    onSubmit(parsed.data);
  }

  /** 직접 나눈 몫의 합이 금액과 맞는지 */
  function validateCustom() {
    return validateCustomShares(
      numAmount,
      currency,
      participants.map((id) => ({ userId: id, share: Number(custom[id]) || 0 })),
    );
  }

  return {
    currencies,
    memberIds,
    amount,
    setAmount,
    currency,
    setCurrency,
    decimals,
    payerId,
    setPayerId,
    participants,
    toggleParticipant,
    toggleAllParticipants,
    splitMode,
    setSplitMode,
    custom,
    setCustom,
    equalPreview,
    customDiff,
    category,
    setCategory,
    memo,
    setMemo,
    spentOn,
    setSpentOn,
    itemId,
    setItemId,
    error,
    submit,
  };
}

export type ExpenseFormState = ReturnType<typeof useExpenseForm>;
