import { describe, expect, it } from "vitest";

import { amountDraft, parseAmount, tripCurrencies } from "./input";

describe("금액 입력", () => {
  it("여행 통화는 기준 통화가 맨 앞", () => {
    expect(tripCurrencies("KRW", { JPY: { unit: 100, value: 920 } })).toEqual(["KRW", "JPY"]);
    expect(tripCurrencies("KRW", {})).toEqual(["KRW"]);
  });

  it("금액 글자 — 쉼표를 버리고, 원 · 엔은 점 뒤를 버린다. 비면 null", () => {
    expect(parseAmount("1,160", "JPY")).toBe(1160);
    expect(parseAmount("12.5", "JPY")).toBe(12);
    expect(parseAmount("12.345", "USD")).toBe(12.34);
    expect(parseAmount("0", "JPY")).toBe(0);
    expect(parseAmount("", "JPY")).toBeNull();
    expect(parseAmount("엔", "JPY")).toBeNull();
    expect(amountDraft(900)).toBe("900");
    expect(amountDraft(null)).toBe("");
  });
});
