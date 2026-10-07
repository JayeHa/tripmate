import { decimalsOf, type ExchangeRates, roundTo } from "@/shared/lib/money";

import type { ExpenseWithSplits, Settlement } from "../model/types";
import { toHomeFor } from "./amounts";
import { payerOf, type PersonKey, personKey, type PersonRef, splitPerson } from "./person";
import type { Transfer } from "./settle";

export type Balances = {
  /** 기준 화폐로 결제한 돈 */
  paid: Record<PersonKey, number>;
  /** 기준 화폐로 쓴 돈(내 몫) */
  spent: Record<PersonKey, number>;
  /** paid − spent. 양수면 받을 돈, 음수면 낼 돈. 합은 정확히 0 */
  net: Record<PersonKey, number>;
  /** 쓴 통화별로 결제한 돈 (표시용) */
  paidByCurrency: Record<PersonKey, Record<string, number>>;
  /** 통화별 총 지출 */
  totalByCurrency: Record<string, number>;
  /** 기준 화폐 총 지출 */
  totalHome: number;
};

/**
 * 사람별 결제한 돈 · 쓴 돈 · 차액. 합계에서 뺀 지출(counted = false)은 쓰지 않은 돈이라 정산에도 넣지 않는다.
 *
 * **「각자 냄」**(split_each)은 각자 자기 몫을 낸 비용이라 차액을 만들지 않는다 — 쓴 돈에는 들어가지만
 * 결제한 돈에도 같은 금액이 들어가 net 이 0 이다. **이미 보낸 돈**(settlements)은 차액에서 뺀다.
 * 환율은 지출에 적은 것이 먼저고, 없으면 여행 기본 환율이다. 그것도 없으면 MissingRateError
 */
export function computeNetBalances(
  expenses: ExpenseWithSplits[],
  people: PersonRef[],
  home: string,
  rates: ExchangeRates,
  settlements: Settlement[] = [],
): Balances {
  const keys = new Set(people.map(personKey));
  const paid: Record<PersonKey, number> = {};
  const spent: Record<PersonKey, number> = {};
  const paidByCurrency: Record<PersonKey, Record<string, number>> = {};
  const totalByCurrency: Record<string, number> = {};
  let totalHome = 0;

  /** 사람 칸을 만든다 — 목록에 없던 사람(나간 멤버 등)도 계산에는 넣는다 */
  const ensure = (key: PersonKey) => {
    keys.add(key);
    paid[key] ??= 0;
    spent[key] ??= 0;
    paidByCurrency[key] ??= {};
    return key;
  };
  keys.forEach(ensure);

  /** 그 사람이 결제한 돈에 더한다(기준 화폐 · 쓴 통화 둘 다) */
  const addPaid = (key: PersonKey, homeAmount: number, currency: string, amount: number) => {
    paid[key] += homeAmount;
    paidByCurrency[key][currency] = (paidByCurrency[key][currency] ?? 0) + amount;
  };

  for (const e of expenses) {
    if (!e.counted) continue;
    const amount = Number(e.amount);
    const homeAmount = toHomeFor(e, amount, home, rates);
    totalByCurrency[e.currency] = (totalByCurrency[e.currency] ?? 0) + amount;
    totalHome += homeAmount;

    const payer = payerOf(e);
    if (payer) addPaid(ensure(personKey(payer)), homeAmount, e.currency, amount);

    for (const s of e.splits) {
      const person = splitPerson(s);
      if (!person) continue;
      const key = ensure(personKey(person));
      const share = toHomeFor(e, Number(s.share), home, rates);
      spent[key] += share;
      // 각자 냄 — 자기 몫을 자기가 냈다. 결제한 돈에도 넣어 차액을 0 으로 둔다
      if (e.split_each) addPaid(key, share, e.currency, Number(s.share));
    }
  }

  const d = decimalsOf(home);
  const net: Record<PersonKey, number> = {};
  for (const key of keys) net[key] = roundTo(paid[key] - spent[key], d);

  // 반올림 드리프트 보정: |net| 이 가장 큰 사람에게 몰아서 합계를 정확히 0으로
  const drift = roundTo(
    Object.values(net).reduce((a, b) => a + b, 0),
    d,
  );
  if (drift !== 0) {
    const target = Object.entries(net).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0]?.[0];
    if (target) net[target] = roundTo(net[target] - drift, d);
  }

  applySettlements(net, settlements, d, ensure);

  return { paid, spent, net, paidByCurrency, totalByCurrency, totalHome: roundTo(totalHome, d) };
}

/** 송금 기록의 한쪽 — 멤버 또는 정산 인원 */
function settlementPerson(userId: string | null, guestId: string | null): PersonRef | null {
  if (userId) return { kind: "member", id: userId };
  if (guestId) return { kind: "guest", id: guestId };
  return null;
}

/** 송금 기록을 송금 한 줄(사람 키)로. 한쪽이라도 비어 있으면(지워진 사람) null */
export function settlementTransfer(s: Settlement): Transfer | null {
  const from = settlementPerson(s.from_user_id, s.from_guest_id);
  const to = settlementPerson(s.to_user_id, s.to_guest_id);
  if (!from || !to) return null;
  return { from: personKey(from), to: personKey(to), amount: Number(s.amount) };
}

/** 이미 보낸 돈을 차액에서 뺀다 — 보낸 사람은 낼 돈이 줄고, 받은 사람은 받을 돈이 준다 */
function applySettlements(
  net: Record<PersonKey, number>,
  settlements: Settlement[],
  decimals: number,
  ensure: (key: PersonKey) => PersonKey,
) {
  for (const s of settlements) {
    const from = settlementPerson(s.from_user_id, s.from_guest_id);
    const to = settlementPerson(s.to_user_id, s.to_guest_id);
    if (!from || !to) continue;
    const amount = Number(s.amount);
    const fromKey = ensure(personKey(from));
    const toKey = ensure(personKey(to));
    net[fromKey] = roundTo((net[fromKey] ?? 0) + amount, decimals);
    net[toKey] = roundTo((net[toKey] ?? 0) - amount, decimals);
  }
}
