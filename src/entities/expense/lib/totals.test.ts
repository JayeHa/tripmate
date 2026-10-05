import { describe, expect, it } from "vitest";

import { sumExpenses } from "./totals";

const rates = { JPY: { unit: 100, value: 920 } };

/** 합계에 쓰는 칸만 가진 지출 */
function e(amount: number, currency: string, over: { rate?: number; counted?: boolean } = {}) {
  return { amount, currency, rate: over.rate ?? null, counted: over.counted ?? true };
}

describe("sumExpenses", () => {
  it("기준 화폐로 더하고 통화별 합계를 함께 낸다 — 지출별 환율이 먼저", () => {
    const t = sumExpenses(
      [e(10000, "KRW"), e(3000, "JPY"), e(12400, "JPY", { rate: 8.883 })],
      "KRW",
      rates,
    );
    // 10,000 + 3,000 × 9.2 + 12,400 × 8.883 = 147,749.2 → 147,749
    expect(t).toEqual({ home: 147749, byCurrency: { KRW: 10000, JPY: 15400 }, missing: [] });
  });

  it("합계에서 뺀 지출은 어디에도 넣지 않는다", () => {
    const t = sumExpenses([e(10000, "KRW"), e(5000, "KRW", { counted: false })], "KRW", rates);
    expect(t).toEqual({ home: 10000, byCurrency: { KRW: 10000 }, missing: [] });
  });

  it("환율을 모르는 통화는 통화별 합계에만 넣고 missing 으로 알린다", () => {
    const t = sumExpenses([e(10000, "KRW"), e(12.5, "USD"), e(38, "USD")], "KRW", rates);
    expect(t).toEqual({ home: 10000, byCurrency: { KRW: 10000, USD: 50.5 }, missing: ["USD"] });
  });

  it("지출이 없으면 0", () => {
    expect(sumExpenses([], "KRW", rates)).toEqual({ home: 0, byCurrency: {}, missing: [] });
  });
});
