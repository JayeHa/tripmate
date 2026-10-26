import { describe, expect, it } from "vitest";

import { addAmount, convertAmount, pressKey, quickAmounts } from "./calculator";

describe("pressKey", () => {
  it("숫자 · 00 은 뒤에 붙이고 앞자리 0 은 버린다, ⌫ 는 한 자리 지운다", () => {
    expect(pressKey("32", "0")).toBe("320");
    expect(pressKey("32", "00")).toBe("3200");
    expect(pressKey("", "0")).toBe("");
    expect(pressKey("", "00")).toBe("");
    expect(pressKey("3200", "⌫")).toBe("320");
    expect(pressKey("", "⌫")).toBe("");
  });

  it("8자리를 넘지 않는다", () => {
    expect(pressKey("1234567", "8")).toBe("12345678");
    expect(pressKey("12345678", "9")).toBe("12345678");
    expect(pressKey("1234567", "00")).toBe("1234567");
  });
});

describe("addAmount", () => {
  it("빈 금액에도 더하고, 8자리를 넘으면 그대로", () => {
    expect(addAmount("", 1000)).toBe("1000");
    expect(addAmount("3200", 5000)).toBe("8200");
    expect(addAmount("99999999", 1)).toBe("99999999");
  });
});

describe("convertAmount", () => {
  const rates = { JPY: { unit: 100, value: 920 } };

  it("여행지 통화 ↔ 기준 화폐를 여행 환율로", () => {
    expect(convertAmount(3200, "JPY", "KRW", "KRW", rates)).toBe(29440);
    expect(convertAmount(9200, "KRW", "JPY", "KRW", rates)).toBe(1000);
  });

  it("환율이 없으면 null", () => {
    expect(convertAmount(10, "USD", "KRW", "KRW", rates)).toBeNull();
    expect(convertAmount(10, "KRW", "USD", "KRW", rates)).toBeNull();
  });
});

describe("quickAmounts", () => {
  it("대략 1만 · 5만 · 10만 원어치를 둥근 수로", () => {
    expect(quickAmounts("KRW")).toEqual([10_000, 50_000, 100_000]);
    expect(quickAmounts("JPY")).toEqual([1000, 5000, 10_000]);
    expect(quickAmounts("USD")).toEqual([5, 20, 50]);
    expect(quickAmounts("VND")).toEqual([100_000, 500_000, 1_000_000]);
  });
});
