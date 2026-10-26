import { describe, expect, it } from "vitest";

import { amountFromParam } from "./amount-param";

describe("amountFromParam", () => {
  const currencies = ["KRW", "JPY"];

  it("정수 금액과 여행의 통화면 그대로", () => {
    expect(amountFromParam("3200", "JPY", currencies)).toEqual({ amount: "3200", currency: "JPY" });
  });

  it("빈 값 · 0 · 소수 · 너무 긴 수 · 여행에 없는 통화는 받지 않는다", () => {
    expect(amountFromParam(null, "JPY", currencies)).toBeUndefined();
    expect(amountFromParam("0", "JPY", currencies)).toBeUndefined();
    expect(amountFromParam("12.5", "JPY", currencies)).toBeUndefined();
    expect(amountFromParam("1234567890", "JPY", currencies)).toBeUndefined();
    expect(amountFromParam("3200", "USD", currencies)).toBeUndefined();
  });
});
