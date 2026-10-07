import {
  expenseHome,
  type ExpenseWithSplits,
  payerOf,
  type PersonKey,
  personKey,
  type PersonRef,
  splitPerson,
  toHomeFor,
} from "@/entities/expense";
import type { ExchangeRates } from "@/shared/lib/money";

import type { TransferRow } from "./dashboard";

/** 사람 상세의 송금 한 줄 — 그 사람 입장(받는지 · 보내는지, 상대) */
export type PersonTransfer = {
  key: string;
  other: PersonKey;
  receive: boolean;
  amount: number;
  /** 이미 보냈다고 적은 송금이면 그 기록 id(취소 = 지우기). 남은 송금이면 null */
  settlementId: string | null;
};

/** 그 사람이 주고받는 송금만, 그 사람 입장으로. 남은 송금 다음에 보낸 송금(transferRows 순서 그대로) */
export function personTransfers(rows: TransferRow[], person: PersonKey): PersonTransfer[] {
  return rows
    .filter((t) => t.from === person || t.to === person)
    .map((t) => ({
      key: t.key,
      other: t.to === person ? t.from : t.to,
      receive: t.to === person,
      amount: t.amount,
      settlementId: t.done ? t.key : null,
    }));
}

/** 받을 돈 · 보낼 돈 상자 — 차액(이미 보낸 돈을 뺀 뒤)이 0 에 가까우면 정산 없음 */
export function netBox(
  net: number,
  decimals: number,
): { kind: "recv" | "send" | "none"; amount: number } {
  const eps = 0.5 / 10 ** decimals;
  if (net > eps) return { kind: "recv", amount: net };
  if (net < -eps) return { kind: "send", amount: -net };
  return { kind: "none", amount: 0 };
}

/** 「결제한 비용」(그 사람이 결제한, 각자 냄 제외) · 「함께한 비용」(그 사람 몫이 있는) */
export type PersonExpenseTab = "paid" | "with";

/**
 * 사람 상세 아래 목록 — 탭마다 비용과 기준 화폐 금액(결제한 비용은 총액, 함께한 비용은 그 사람 몫).
 * 합계에서 뺀 비용은 정산에서 빠지므로 넣지 않는다. 환율이 없는 비용이 있으면 부른 쪽이 먼저 막는다(정산을 계산하지 못한다)
 */
export function personExpenses(
  expenses: ExpenseWithSplits[],
  person: PersonRef,
  tab: PersonExpenseTab,
  home: string,
  rates: ExchangeRates,
): { expense: ExpenseWithSplits; amount: number }[] {
  const key = personKey(person);
  return expenses.flatMap((e) => {
    if (!e.counted) return [];
    if (tab === "paid") {
      const payer = payerOf(e);
      if (e.split_each || !payer || personKey(payer) !== key) return [];
      return [{ expense: e, amount: expenseHome(e, home, rates) }];
    }
    const split = e.splits.find((s) => {
      const p = splitPerson(s);
      return p !== null && personKey(p) === key;
    });
    return split ? [{ expense: e, amount: toHomeFor(e, Number(split.share), home, rates) }] : [];
  });
}
