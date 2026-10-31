import { describe, expect, it } from "vitest";

import type { ExpenseWithSplits } from "@/entities/expense";

import { actualFares } from "./transport-actual";

type Shares = Record<string, number>;

/** 테스트용 비용 — 사람별 몫을 그대로 적는다 */
function expense(
  id: string,
  over: Partial<ExpenseWithSplits> & { shares: Shares },
): ExpenseWithSplits {
  const { shares, ...rest } = over;
  return {
    id,
    trip_id: "t",
    schedule_item_id: null,
    stay_id: null,
    flight_id: null,
    payer_id: "me",
    amount: Object.values(shares).reduce((a, b) => a + b, 0),
    currency: "JPY",
    category: "transport",
    name: id,
    memo: null,
    payer_guest_id: null,
    split_each: false,
    payment_method: "cash",
    rate: null,
    counted: true,
    paid: true,
    due_date: null,
    spent_on: "2026-10-31",
    spent_time: null,
    split_mode: "equal",
    created_by: null,
    created_at: "",
    updated_at: "",
    ...rest,
    splits: Object.entries(shares).map(([userId, share]) => ({
      id: `${id}:${userId}`,
      expense_id: id,
      trip_id: "t",
      user_id: userId,
      guest_id: null,
      share,
    })),
  };
}

const START = "2026-10-31";

describe("actualFares", () => {
  it("교통 비용의 내 몫만 날짜별 · 통화별로 더한다", () => {
    const result = actualFares(
      [
        expense("a", { shares: { me: 200, you: 200 } }),
        expense("b", { shares: { me: 500 } }),
        expense("c", { shares: { me: 3000 }, currency: "KRW" }),
        expense("d", { shares: { me: 1000 }, spent_on: "2026-11-02" }),
      ],
      "me",
      START,
      5,
    );
    expect(result.byDay.get(0)).toEqual([
      { currency: "JPY", amount: 700 },
      { currency: "KRW", amount: 3000 },
    ]);
    expect(result.byDay.get(2)).toEqual([{ currency: "JPY", amount: 1000 }]);
    expect(result.byDay.has(1)).toBe(false);
    expect(result.total).toEqual([
      { currency: "JPY", amount: 1700 },
      { currency: "KRW", amount: 3000 },
    ]);
    expect(result.undated).toEqual([]);
  });

  it("다른 카테고리 · 합계에서 뺀 비용 · 함께하지 않은 비용은 뺀다", () => {
    const result = actualFares(
      [
        expense("food", { shares: { me: 900 }, category: "food" }),
        expense("off", { shares: { me: 900 }, counted: false }),
        expense("theirs", { shares: { you: 900 } }),
      ],
      "me",
      START,
      5,
    );
    expect(result.total).toEqual([]);
    expect(result.byDay.size).toBe(0);
  });

  it("날짜 없는 비용(여행준비) · 기간 밖 날짜는 날짜 없음으로", () => {
    const result = actualFares(
      [
        expense("prep", { shares: { me: 4000 }, spent_on: null }),
        expense("after", { shares: { me: 600 }, spent_on: "2026-11-05" }),
      ],
      "me",
      START,
      5,
    );
    expect(result.undated).toEqual([{ currency: "JPY", amount: 4600 }]);
    expect(result.byDay.size).toBe(0);
    expect(result.total).toEqual([{ currency: "JPY", amount: 4600 }]);
  });
});
