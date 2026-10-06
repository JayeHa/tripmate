import { describe, expect, it } from "vitest";

import type { ExpenseWithSplits } from "../model/types";
import { expenseSections, periodOf } from "./sections";

const trip = {
  start_date: "2026-10-31",
  end_date: "2026-11-02",
  home_currency: "KRW",
  exchange_rates: { JPY: { unit: 100, value: 920 } },
};

/** 묶음에 쓰는 칸만 채운 지출 */
function e(
  id: string,
  spentOn: string | null,
  amount: number,
  createdAt: string,
  over: Partial<ExpenseWithSplits> = {},
) {
  return {
    id,
    spent_on: spentOn,
    amount,
    currency: "KRW",
    rate: null,
    counted: true,
    paid: true,
    created_at: createdAt,
    ...over,
  } as ExpenseWithSplits;
}

describe("periodOf", () => {
  it("날짜가 없으면 여행준비, 있으면 몇째 날 — 기간 밖은 끝에 붙인다", () => {
    expect(periodOf({ spent_on: null }, trip)).toBe("prep");
    expect(periodOf({ spent_on: "2026-11-01" }, trip)).toBe(1);
    expect(periodOf({ spent_on: "2026-11-09" }, trip)).toBe(2);
  });
});

describe("expenseSections", () => {
  const list = [
    e("b", "2026-10-31", 3000, "2026-10-31T12:00"),
    e("prep", null, 466240, "2026-10-01T00:00"),
    e("a", "2026-10-31", 1000, "2026-10-31T09:00"),
    e("x", "2026-10-31", 9000, "2026-10-31T10:00", { counted: false }),
  ];

  it("여행준비 → day 1 … 순서, 빈 날도 묶음이 있고, 묶음 안은 쓴 순서", () => {
    const sections = expenseSections(list, trip);
    expect(sections.map((s) => s.period)).toEqual(["prep", 0, 1, 2]);
    expect(sections[1].expenses.map((x) => x.id)).toEqual(["a", "x", "b"]);
    expect(sections[2].expenses).toEqual([]);
  });

  it("묶음 합계에서 합계 제외 지출은 빠진다", () => {
    const sections = expenseSections(list, trip);
    expect(sections[0].total.home).toBe(466240);
    expect(sections[1].total.home).toBe(4000);
    expect(sections[2].total.home).toBe(0);
  });

  it("filter 를 주면 그 묶음만", () => {
    expect(expenseSections(list, trip, "prep").map((s) => s.period)).toEqual(["prep"]);
    expect(expenseSections(list, trip, 2).map((s) => s.period)).toEqual([2]);
  });

  it("묶음 안 순서는 시각으로 — 소수 초가 빠진 시각도 바르게", () => {
    const sections = expenseSections(
      [
        e("later", null, 1, "2026-10-06T10:00:05.5+00:00"),
        e("first", null, 1, "2026-10-06T10:00:05+00:00"),
      ],
      trip,
      "prep",
    );
    expect(sections[0].expenses.map((x) => x.id)).toEqual(["first", "later"]);
  });
});
