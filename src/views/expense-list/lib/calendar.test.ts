import { describe, expect, it } from "vitest";

import type { ExpenseSection, ExpenseWithSplits } from "@/entities/expense";

import { calendarCells } from "./calendar";

/** 묶음 — 지출은 결제 여부만 본다 */
function section(period: ExpenseSection["period"], paid: boolean[]): ExpenseSection {
  return {
    period,
    expenses: paid.map((p) => ({ paid: p }) as ExpenseWithSplits),
    total: { home: 0, byCurrency: {}, planned: 0, missing: [] },
  };
}

describe("calendarCells", () => {
  it("여행준비는 「준비 · 여행 전」, day N 은 day · 일 · 요일 · 주말 색", () => {
    // 2026-10-31 은 토요일
    const cells = calendarCells(
      [section("prep", [true]), section(0, []), section(1, [true, false])],
      "2026-10-31",
    );
    expect(cells).toEqual([
      {
        key: "prep",
        label: "",
        num: "준비",
        sub: "여행 전",
        weekend: null,
        hasExpense: true,
        planned: false,
      },
      {
        key: "0",
        label: "day 1",
        num: "31",
        sub: "토",
        weekend: "sat",
        hasExpense: false,
        planned: false,
      },
      {
        key: "1",
        label: "day 2",
        num: "1",
        sub: "일",
        weekend: "sun",
        hasExpense: true,
        planned: true,
      },
    ]);
  });
});
