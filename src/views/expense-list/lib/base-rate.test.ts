import { describe, expect, it } from "vitest";

import { baseRateLine } from "./base-rate";

describe("baseRateLine", () => {
  const rates = { JPY: { unit: 100, value: 920 }, USD: { unit: 1, value: 1400 } };

  it("쓰인 외화마다 기준 단위 값 — 기준 화폐 · 환율 없는 통화 · 중복은 뺀다", () => {
    expect(baseRateLine(["JPY", "KRW", "JPY", "USD", "EUR"], "KRW", rates)).toBe(
      "엔 920 · 달러 1,400 기준",
    );
  });

  it("보일 것이 없으면 null", () => {
    expect(baseRateLine(["KRW"], "KRW", rates)).toBeNull();
  });
});
