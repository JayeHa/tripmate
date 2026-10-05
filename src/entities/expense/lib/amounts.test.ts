import { describe, expect, it } from "vitest";

import { MissingRateError } from "@/shared/lib/money";

import { expenseHome, expenseRate } from "./amounts";

const rates = { JPY: { unit: 100, value: 920 } };

describe("expenseRate", () => {
  it("기준 화폐로 쓴 지출은 1", () => {
    expect(expenseRate({ currency: "KRW", rate: null }, "KRW", rates)).toBe(1);
    expect(expenseRate({ currency: "KRW", rate: 3 }, "KRW", rates)).toBe(1);
  });

  it("지출에 적은 환율이 먼저, 없으면 여행 기본 환율", () => {
    expect(expenseRate({ currency: "JPY", rate: 8.883 }, "KRW", rates)).toBe(8.883);
    expect(expenseRate({ currency: "JPY", rate: null }, "KRW", rates)).toBe(9.2);
  });

  it("둘 다 없으면 던진다", () => {
    expect(() => expenseRate({ currency: "USD", rate: null }, "KRW", rates)).toThrow(
      MissingRateError,
    );
  });
});

describe("expenseHome", () => {
  it("금액 × 환율", () => {
    expect(expenseHome({ amount: 12400, currency: "JPY", rate: 8.883 }, "KRW", rates)).toBeCloseTo(
      110149.2,
    );
    expect(expenseHome({ amount: 466240, currency: "KRW", rate: null }, "KRW", rates)).toBe(466240);
  });
});
