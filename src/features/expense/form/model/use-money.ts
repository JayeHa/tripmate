import { useMemo, useState } from "react";

import type { ExpenseFormValues } from "@/entities/expense";
import type { Trip } from "@/entities/trip";
import { decimalsOf } from "@/shared/lib/money";

import { cleanAmount, fitAmountDraft } from "../lib/amount-draft";
import { homeAmountOrNull, rateLine } from "../lib/rate-line";

type MoneyOptions = {
  trip: Trip;
  /** 처음 값(startValues) */
  start: { amount: string; currency: string; rate: number | null };
  /** 연 때의 값 — 연 때의 통화로 돌아오면 연 때의 환율을 되살린다 */
  opened: ExpenseFormValues | undefined;
};

/**
 * 비용 입력의 금액 · 통화 · 환율. 금액은 입력 중인 문자열로 든다.
 * 통화를 바꾸면 이 지출에만 적은 환율을 비운다(옛 통화 기준이라). 「환율설정」 창이 열려 있는지도 여기 둔다 —
 * 머리의 ⋯ 메뉴와 금액 아래 환율 줄이 같은 창을 연다
 */
export function useMoney({ trip, start, opened }: MoneyOptions) {
  const currencies = useMemo(
    () => [trip.home_currency, ...Object.keys(trip.exchange_rates)],
    [trip],
  );
  const [amount, setAmountDraft] = useState(start.amount);
  const [currency, setCurrencyState] = useState(start.currency);
  const [rate, setRate] = useState(start.rate);
  const [rateOpen, setRateOpen] = useState(false);
  const home = trip.home_currency;
  const numAmount = Number(amount) || 0;

  /**
   * 통화를 바꾸고, 금액의 소수부를 새 통화에 맞춰 자른다. 이 지출 환율은 옛 통화 기준이라 비우되,
   * 연 때의 통화로 돌아오면 연 때의 환율을 되살린다 — 화면의 「엔 920 기준」 과 저장되는 환율이 어긋나지 않게
   */
  function setCurrency(next: string) {
    setCurrencyState(next);
    setAmountDraft((draft) => fitAmountDraft(draft, decimalsOf(next)));
    setRate(next === opened?.currency ? opened.rate : null);
  }

  return {
    currencies,
    home,
    amount,
    /** 입력한 글을 이 통화의 금액 초안으로 */
    setAmount: (input: string) => setAmountDraft(cleanAmount(input, decimalsOf(currency))),
    numAmount,
    homeAmount: homeAmountOrNull(numAmount, currency, rate, home, trip.exchange_rates),
    rateText: rateLine(currency, home, trip.exchange_rates, rate),
    currency,
    setCurrency,
    /** 이 지출에만 적은 환율(1단위 값). null 이면 여행 환율 */
    rate,
    setRate,
    rateOpen,
    openRate: () => setRateOpen(true),
    closeRate: () => setRateOpen(false),
  };
}
