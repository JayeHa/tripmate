import { describe, expect, it } from "vitest";

import { splitEqual } from "@/shared/lib/money";

import type { ExpenseWithSplits } from "../model/types";
import { computeNetBalances } from "./balances";

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
    memo: null,
    spent_on: "2026-10-29",
    split_mode: "equal",
    created_by: null,
    created_at: "",
    updated_at: "",
    splits: splitEqual(amount, currency, participants).map((s) => ({
      expense_id: id,
      user_id: s.userId,
      share: s.share,
    })),
  };
}

const members = ["a", "b", "c"];

describe("computeNetBalances", () => {
  it("payer in participants gets amount*(n-1)/n", () => {
    const b = computeNetBalances([expense("e1", "a", 3000, "KRW", members)], members, "KRW", rates);
    expect(b.net).toEqual({ a: 2000, b: -1000, c: -1000 });
  });

  it("payer not in participants gets full amount", () => {
    const b = computeNetBalances(
      [expense("e1", "a", 2000, "KRW", ["b", "c"])],
      members,
      "KRW",
      rates,
    );
    expect(b.net).toEqual({ a: 2000, b: -1000, c: -1000 });
  });

  it("converts mixed currencies before summing", () => {
    const b = computeNetBalances(
      [expense("e1", "a", 3000, "JPY", members), expense("e2", "b", 9000, "KRW", members)],
      members,
      "KRW",
      rates,
    );
    // a paid 27,000 KRW-eq, b paid 9,000, c 0; each owes 12,000
    expect(b.net).toEqual({ a: 15000, b: -3000, c: -12000 });
    expect(b.totalByCurrency).toEqual({ JPY: 3000, KRW: 9000 });
    expect(b.totalHome).toBe(36000);
    expect(b.paidByCurrency.a).toEqual({ JPY: 3000 });
  });

  it("inactive members have net 0", () => {
    const b = computeNetBalances(
      [expense("e1", "a", 100, "KRW", ["a", "b"])],
      members,
      "KRW",
      rates,
    );
    expect(b.net.c).toBe(0);
  });

  it("sums to zero after rounding with awkward rate", () => {
    const awkward = { JPY: { unit: 100, value: 913 } };
    const b = computeNetBalances(
      [expense("e1", "a", 1000, "JPY", members), expense("e2", "b", 777, "JPY", members)],
      members,
      "KRW",
      awkward,
    );
    const sum = Object.values(b.net).reduce((x, y) => x + y, 0);
    expect(sum).toBe(0);
    for (const v of Object.values(b.net)) expect(Number.isInteger(v)).toBe(true);
  });
});
