import { describe, expect, it } from "vitest";

import { MissingRateError, roundTo } from "@/shared/lib/money";

import { expenseHome, toHomeFor } from "./amounts";

const rates = { JPY: { unit: 100, value: 920 } };

describe("toHomeFor", () => {
  it("기준 화폐로 쓴 지출은 그대로 — 지출에 환율이 적혀 있어도", () => {
    expect(toHomeFor({ currency: "KRW", rate: 3 }, 5000, "KRW", rates)).toBe(5000);
  });

  it("지출에 적은 환율이 먼저, 없으면 여행 기본 환율", () => {
    expect(toHomeFor({ currency: "JPY", rate: 8.883 }, 1000, "KRW", rates)).toBeCloseTo(8883);
    expect(toHomeFor({ currency: "JPY", rate: null }, 1000, "KRW", rates)).toBe(9200);
  });

  it("기본 환율은 곱한 뒤 나눈다 — .5 경계에서 반올림이 틀어지지 않게", () => {
    const odd = { JPY: { unit: 100, value: 850.1 } };
    // 3,500 × 850.1 / 100 = 29,753.5 → 29,754 (나눈 뒤 곱하면 29,753.4999… → 29,753)
    expect(roundTo(toHomeFor({ currency: "JPY", rate: null }, 3500, "KRW", odd), 0)).toBe(29754);
  });

  it("둘 다 없으면 던진다", () => {
    expect(() => toHomeFor({ currency: "USD", rate: null }, 1, "KRW", rates)).toThrow(
      MissingRateError,
    );
  });
});

describe("expenseHome", () => {
  it("금액을 기준 화폐로", () => {
    expect(expenseHome({ amount: 12400, currency: "JPY", rate: 8.883 }, "KRW", rates)).toBeCloseTo(
      110149.2,
    );
    expect(expenseHome({ amount: 466240, currency: "KRW", rate: null }, "KRW", rates)).toBe(466240);
  });
});
