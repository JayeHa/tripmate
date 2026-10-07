import { describe, expect, it } from "vitest";

import type { ExpenseWithSplits } from "@/entities/expense";

import { linkCosts } from "./link-costs";

/** 테스트용 비용 — 금액 · 통화 · 연결 일정만 */
function expense(id: string, amount: number, currency: string, item: string | null) {
  return {
    id,
    amount,
    currency,
    rate: null,
    schedule_item_id: item,
  } as unknown as ExpenseWithSplits;
}

describe("linkCosts", () => {
  const rates = { JPY: { unit: 100, value: 900 } };

  it("일정마다 연결된 비용을 기준 화폐로 더한다 — 고치는 비용 · 연결 없는 비용 · 환율 없는 비용은 빼고", () => {
    const costs = linkCosts(
      [
        expense("a", 1000, "JPY", "s1"),
        expense("b", 5000, "KRW", "s1"),
        expense("c", 3000, "KRW", "s2"),
        expense("d", 7000, "KRW", null),
        expense("e", 10, "EUR", "s1"),
      ],
      "KRW",
      rates,
      "c",
    );
    expect(Object.fromEntries(costs)).toEqual({ s1: 14000 });
  });
});
