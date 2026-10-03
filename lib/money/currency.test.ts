import { describe, expect, it } from "vitest";
import { MissingRateError, formatMoney, roundTo, toHome } from "./currency";

const rates = { JPY: { unit: 100, value: 900 }, USD: { unit: 1, value: 1350 } };

describe("toHome", () => {
  it("returns identity for home currency", () => {
    expect(toHome(5000, "KRW", "KRW", rates)).toBe(5000);
  });
  it("converts with unit", () => {
    expect(toHome(100, "JPY", "KRW", rates)).toBe(900);
    expect(toHome(1234, "JPY", "KRW", rates)).toBeCloseTo(11106);
    expect(toHome(2, "USD", "KRW", rates)).toBe(2700);
  });
  it("throws when rate missing", () => {
    expect(() => toHome(1, "EUR", "KRW", rates)).toThrow(MissingRateError);
  });
});

describe("roundTo", () => {
  it("handles float noise", () => {
    expect(roundTo(0.1 + 0.2, 2)).toBe(0.3);
    expect(roundTo(1234.5, 0)).toBe(1235);
  });
});

describe("formatMoney", () => {
  it("formats by currency decimals", () => {
    expect(formatMoney(12345, "KRW")).toBe("₩12,345");
    expect(formatMoney(1000, "JPY")).toBe("¥1,000");
    expect(formatMoney(3.5, "USD")).toBe("$3.50");
  });
});
