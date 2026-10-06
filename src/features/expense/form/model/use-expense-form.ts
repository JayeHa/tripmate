import { useMemo, useState } from "react";

import {
  expenseFormSchema,
  type ExpenseFormValues,
  personKey,
  personOfKey,
} from "@/entities/expense";
import type { Trip } from "@/entities/trip";
import type { TripMember } from "@/entities/trip-member";
import { decimalsOf, splitEqual, validateCustomShares } from "@/shared/lib/money";

import { type SplitMode, startValues } from "../lib/start-values";

type ExpenseFormOptions = {
  trip: Trip;
  members: TripMember[];
  currentUserId: string;
  initial?: ExpenseFormValues;
  /** 새 지출의 처음 날짜 — ""(여행준비) 또는 yyyy-MM-dd */
  defaultSpentOn?: string;
  onSubmit: (values: ExpenseFormValues) => void;
};

/**
 * 지출 입력의 상태와 검증. 화면 조각들은 이 값을 나눠 받아 그리기만 한다.
 * 금액 · 직접 나눈 몫은 입력 중인 문자열로 들고, 제출할 때 숫자로 바꾼다.
 * 날짜를 바꾸면 연결 일정을 비운다(그날 일정에서만 고른다). 날짜가 빈 글이면 여행준비다.
 * 환율 · 결제수단 · 합계 포함 · 결제 상태 · 각자 냄은 칸이 없어 처음 값을 들고만 있다 — 새 지출은 그 값으로 넣고, 수정은 보내지 않는다(updateColumns)
 */
export function useExpenseForm({
  trip,
  members,
  currentUserId,
  initial,
  defaultSpentOn,
  onSubmit,
}: ExpenseFormOptions) {
  const currencies = useMemo(
    () => [trip.home_currency, ...Object.keys(trip.exchange_rates)],
    [trip],
  );
  // 사람은 멤버 · 정산 인원을 함께 다루려고 키(`m:…`)로 고른다. 저장할 때 다시 사람으로 되돌린다.
  // 칩 · 미리보기는 이 목록만 보고 그린다 — ⑥ 에서 정산 인원이 생기면 여기에 더하면 된다
  const people = useMemo(
    () =>
      members.map((m) => ({
        key: personKey({ kind: "member", id: m.user_id }),
        name: m.profile.display_name ?? "이름 없음",
      })),
    [members],
  );
  const memberIds = useMemo(() => people.map((p) => p.key), [people]);

  const [start] = useState(() =>
    startValues({
      trip,
      currencies,
      memberIds,
      currentUserId: personKey({ kind: "member", id: currentUserId }),
      initial,
      defaultSpentOn,
    }),
  );
  const [name, setName] = useState(start.name);
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
      ...start.kept,
      name,
      amount: numAmount,
      currency,
      payer: personOfKey(payerId),
      participants: participants.flatMap((key) => personOfKey(key) ?? []),
      split_mode: splitMode,
      custom_shares: splitMode === "custom" ? customShares() : undefined,
      category,
      memo: memo || undefined,
      spent_on: spentOn || null,
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

  /** 사람 키 → 이름. 모르는 키면 빈 글 */
  function nameOf(key: string) {
    return people.find((p) => p.key === key)?.name ?? "";
  }

  return {
    currencies,
    people,
    nameOf,
    memberIds,
    name,
    setName,
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
