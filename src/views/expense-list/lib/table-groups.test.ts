import { describe, expect, it } from "vitest";

import type { ExpensePeriod, ExpenseWithSplits } from "@/entities/expense";

import { tableGroups } from "./table-groups";

const trip = {
  start_date: "2026-10-30",
  home_currency: "KRW",
  exchange_rates: { JPY: { unit: 1, value: 9 } },
};

/** 금액 · 통화만 채운 비용 */
function expense(id: string, amount: number, currency = "KRW"): ExpenseWithSplits {
  return { id, amount, currency, rate: null, counted: true, paid: true } as ExpenseWithSplits;
}

/** 묶음 하나 — 줄은 비용 id */
function section(period: ExpensePeriod, expenses: ExpenseWithSplits[]) {
  return { period, expenses, rows: expenses.map((e) => e.id), total: { home: 0 } };
}

const sections = [
  section("prep", [expense("a", 5000)]),
  section(0, [expense("b", 1000, "JPY"), expense("c", 3000)]),
  section(1, []),
];

describe("tableGroups", () => {
  it("최신순 — 날짜 묶음 그대로, 비용 없는 날은 합계 없음", () => {
    const groups = tableGroups(sections, "date", trip);
    expect(groups.map((g) => g.key)).toEqual(["prep", "0", "1"]);
    expect(groups[0].title).toBe("여행 준비");
    expect(groups[1].title).toBe("day 1 · 10.30 (금)");
    expect(groups[2].total).toBeNull();
    expect(groups[1].rows[0].tag).toBeNull();
  });

  it("금액순 — 기준 화폐로 환산해 한 목록, 줄마다 날 태그", () => {
    const [high] = tableGroups(sections, "high", trip);
    expect(high.rows.map((r) => r.row)).toEqual(["b", "a", "c"]);
    expect(high.rows.map((r) => r.tag)).toEqual(["day 1", "준비", "day 1"]);
    expect(high.title).toBe("금액 높은순 · 3건");
    expect(high.total).toBe(17000);
    const [low] = tableGroups(sections, "low", trip);
    expect(low.rows.map((r) => r.row)).toEqual(["c", "a", "b"]);
  });

  it("환율을 모르는 비용은 어느 순서든 맨 뒤, 같은 금액은 날짜 순서", () => {
    const s = [
      section("prep", [expense("x", 10, "USD"), expense("y", 100)]),
      section(0, [expense("z", 100)]),
    ];
    expect(tableGroups(s, "high", trip)[0].rows.map((r) => r.row)).toEqual(["y", "z", "x"]);
    expect(tableGroups(s, "low", trip)[0].rows.map((r) => r.row)).toEqual(["y", "z", "x"]);
  });
});
