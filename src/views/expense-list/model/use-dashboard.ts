"use client";

import {
  computeNetBalances,
  minimizeTransfers,
  type PersonKey,
  personKey,
  personOfKey,
  type PersonRef,
  settleBandState,
  type Settlement,
  settlementTransfer,
  useSettlements,
} from "@/entities/expense";
import { decimalsOf, MissingRateError } from "@/shared/lib/money";

import { categoryShares, hasSharedExpense } from "../lib/dashboard";
import type { ExpenseList } from "./use-expense-list";

/** 사람마다 쓴 돈 · 결제한 돈과 남은 송금 · 보낸 송금. 환율이 없는 비용이 있으면 계산하지 않는다(missing = 그 통화) */
function settleOf(list: ExpenseList, settlements: Settlement[]) {
  const { trip } = list;
  try {
    const b = computeNetBalances(
      list.expenses,
      list.people,
      trip.home_currency,
      trip.exchange_rates,
      settlements,
    );
    return {
      missing: null,
      people: list.people.map((p) => {
        const key = personKey(p);
        return { person: p, spent: b.spent[key] ?? 0, paid: b.paid[key] ?? 0 };
      }),
      remaining: minimizeTransfers(b.net, decimalsOf(trip.home_currency)),
    };
  } catch (e) {
    if (e instanceof MissingRateError) return { missing: e.currency, people: [], remaining: [] };
    throw e;
  }
}

/**
 * 「지출 · 정산」 대시보드의 데이터 — 카테고리별 합계, 사람별 쓴 돈 · 결제한 돈, 남은 송금 · 보낸 송금, 정산 띠 상태.
 * 송금 기록(settlements)을 읽기 전에는 `settle` 이 null 이다 — 먼저 그리면 이미 보낸 돈을 빼지 않은 송금을 잠깐 보인다.
 * 「쓴 돈」 은 송금 기록과 상관없어 목록의 값과 같다
 */
export function useDashboard(tripId: string, list: ExpenseList) {
  const { data: settlements } = useSettlements(tripId);
  const { trip } = list;
  const categories = categoryShares(list.expenses, trip.home_currency, trip.exchange_rates);
  /** 정산 줄의 사람 — 표시 이름(모르면 「알 수 없음」)과 사진 */
  const avatarOf = (person: PersonRef) => {
    const a = list.avatarOf(person);
    return { name: a.name || "알 수 없음", url: a.url };
  };
  /** 정산 띠의 사람(키로) */
  const bandPersonOf = (key: PersonKey) => {
    const person = personOfKey(key);
    const a = person ? avatarOf(person) : { name: "알 수 없음", url: null };
    return { name: a.name, avatarUrl: a.url };
  };
  const people = { avatarOf, bandPersonOf };
  if (!settlements) return { categories, settle: null, ...people };
  const settle = settleOf(list, settlements);
  const sent = settlements.flatMap((s) => {
    const t = settlementTransfer(s);
    return t ? [{ ...t, id: s.id }] : [];
  });
  const me = list.meId ? personKey({ kind: "member", id: list.meId }) : null;
  return {
    categories,
    ...people,
    settle: {
      ...settle,
      sent,
      me,
      // 환율이 없어 계산하지 못했으면 띠를 그리지 않는다 — 빈 송금으로 계산하면 「모두 정산됐어요」 가 된다
      band:
        me && !settle.missing
          ? settleBandState(settle.remaining, me, hasSharedExpense(list.expenses))
          : null,
    },
  };
}

export type Dashboard = ReturnType<typeof useDashboard>;
