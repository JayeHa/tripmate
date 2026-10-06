import { describe, expect, it } from "vitest";

import { splitEqual } from "@/shared/lib/money";

import type { ExpenseWithSplits, Settlement } from "../model/types";
import { computeNetBalances } from "./balances";
import { peopleOf, type PersonRef } from "./person";

const rates = { JPY: { unit: 100, value: 900 } };

function expense(
  id: string,
  payer: string,
  amount: number,
  currency: string,
  participants: string[],
): ExpenseWithSplits {
  return {
    id,
    trip_id: "t",
    schedule_item_id: null,
    payer_id: payer,
    amount,
    currency,
    category: "other",
    name: id,
    memo: null,
    payer_guest_id: null,
    split_each: false,
    payment_method: "cash",
    rate: null,
    counted: true,
    paid: true,
    due_date: null,
    spent_on: "2026-10-29",
    split_mode: "equal",
    created_by: null,
    created_at: "",
    updated_at: "",
    splits: splitEqual(amount, currency, participants).map((s) => ({
      id: `${id}:${s.userId}`,
      expense_id: id,
      trip_id: "t",
      user_id: s.userId,
      guest_id: null,
      share: s.share,
    })),
  };
}

const memberIds = ["a", "b", "c"];
const members = peopleOf(memberIds, []);
/** 멤버 키로 바꾼 결과 — 테스트는 사람 id 로 읽는다 */
const byId = (record: Record<string, number>) =>
  Object.fromEntries(Object.entries(record).map(([k, v]) => [k.slice(2), v]));

describe("computeNetBalances", () => {
  it("payer in participants gets amount*(n-1)/n", () => {
    const b = computeNetBalances(
      [expense("e1", "a", 3000, "KRW", memberIds)],
      members,
      "KRW",
      rates,
    );
    expect(byId(b.net)).toEqual({ a: 2000, b: -1000, c: -1000 });
  });

  it("payer not in participants gets full amount", () => {
    const b = computeNetBalances(
      [expense("e1", "a", 2000, "KRW", ["b", "c"])],
      members,
      "KRW",
      rates,
    );
    expect(byId(b.net)).toEqual({ a: 2000, b: -1000, c: -1000 });
  });

  it("converts mixed currencies before summing", () => {
    const b = computeNetBalances(
      [expense("e1", "a", 3000, "JPY", memberIds), expense("e2", "b", 9000, "KRW", memberIds)],
      members,
      "KRW",
      rates,
    );
    // a paid 27,000 KRW-eq, b paid 9,000, c 0; each owes 12,000
    expect(byId(b.net)).toEqual({ a: 15000, b: -3000, c: -12000 });
    expect(b.totalByCurrency).toEqual({ JPY: 3000, KRW: 9000 });
    expect(b.totalHome).toBe(36000);
    expect(b.paidByCurrency["m:a"]).toEqual({ JPY: 3000 });
  });

  it("inactive members have net 0", () => {
    const b = computeNetBalances(
      [expense("e1", "a", 100, "KRW", ["a", "b"])],
      members,
      "KRW",
      rates,
    );
    expect(byId(b.net).c).toBe(0);
  });

  it("sums to zero after rounding with awkward rate", () => {
    const awkward = { JPY: { unit: 100, value: 913 } };
    const b = computeNetBalances(
      [expense("e1", "a", 1000, "JPY", memberIds), expense("e2", "b", 777, "JPY", memberIds)],
      members,
      "KRW",
      awkward,
    );
    const sum = Object.values(b.net).reduce((x, y) => x + y, 0);
    expect(sum).toBe(0);
    for (const v of Object.values(b.net)) expect(Number.isInteger(v)).toBe(true);
  });

  it("합계에서 뺀 지출은 낸 돈 · 몫 · 합계 어디에도 넣지 않는다", () => {
    const b = computeNetBalances(
      [
        expense("e1", "a", 9000, "KRW", memberIds),
        { ...expense("e2", "b", 6000, "KRW", memberIds), counted: false },
      ],
      members,
      "KRW",
      rates,
    );
    expect(byId(b.net)).toEqual({ a: 6000, b: -3000, c: -3000 });
    expect(b.totalHome).toBe(9000);
    expect(b.paidByCurrency["m:b"]).toEqual({});
  });

  it("지출에 적은 환율이 여행 기본 환율보다 먼저다 — 기본 환율이 없어도 계산된다", () => {
    const b = computeNetBalances(
      [
        { ...expense("e1", "a", 3000, "JPY", memberIds), rate: 8.883 },
        { ...expense("e2", "b", 30, "USD", memberIds), rate: 1400 },
      ],
      members,
      "KRW",
      rates,
    );
    // 3,000엔 × 8.883 = 26,649원 · 30달러 × 1,400 = 42,000원 → 한 사람 몫 22,883원
    expect(b.totalHome).toBe(68649);
    expect(byId(b.net)).toEqual({ a: 3766, b: 19117, c: -22883 });
  });

  it("「각자 냄」 은 쓴 돈에만 들어가고 차액을 만들지 않는다", () => {
    const b = computeNetBalances(
      [{ ...expense("e1", "a", 9000, "KRW", memberIds), payer_id: null, split_each: true }],
      members,
      "KRW",
      rates,
    );
    expect(byId(b.net)).toEqual({ a: 0, b: 0, c: 0 });
    expect(byId(b.spent)).toEqual({ a: 3000, b: 3000, c: 3000 });
    expect(b.totalHome).toBe(9000);
  });

  it("정산 인원도 결제하고 나눈다", () => {
    const people: PersonRef[] = peopleOf(["a"], [{ id: "g1" }]);
    const shared: ExpenseWithSplits = {
      ...expense("e1", "a", 10000, "KRW", ["a"]),
      payer_id: null,
      payer_guest_id: "g1",
      splits: [
        { id: "s1", expense_id: "e1", trip_id: "t", user_id: "a", guest_id: null, share: 5000 },
        { id: "s2", expense_id: "e1", trip_id: "t", user_id: null, guest_id: "g1", share: 5000 },
      ],
    };
    const b = computeNetBalances([shared], people, "KRW", rates);
    expect(b.net).toEqual({ "m:a": -5000, "g:g1": 5000 });
  });

  it("이미 보낸 돈은 차액에서 뺀다", () => {
    const settlement = (from: string, to: string, amount: number): Settlement => ({
      id: `t:${from}`,
      trip_id: "t",
      from_user_id: from,
      from_guest_id: null,
      to_user_id: to,
      to_guest_id: null,
      amount,
      settled_at: "",
      created_by: null,
    });
    const expenses = [expense("e1", "a", 3000, "KRW", memberIds)];
    const before = computeNetBalances(expenses, members, "KRW", rates);
    expect(byId(before.net)).toEqual({ a: 2000, b: -1000, c: -1000 });

    const after = computeNetBalances(expenses, members, "KRW", rates, [settlement("b", "a", 1000)]);
    expect(byId(after.net)).toEqual({ a: 1000, b: 0, c: -1000 });
  });
});
