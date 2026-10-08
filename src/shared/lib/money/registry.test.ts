import { describe, expect, it } from "vitest";

import { CURRENCIES, defaultRate, searchCurrencies } from "./registry";

describe("CURRENCIES", () => {
  it("코드가 겹치지 않는다", () => {
    const codes = CURRENCIES.map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});

describe("defaultRate", () => {
  it("원 기준 — 엔은 100엔, 달러는 1달러, 1 보다 작은 통화는 100 단위", () => {
    expect(defaultRate("JPY", "KRW")).toEqual({ unit: 100, value: 920 });
    expect(defaultRate("USD", "KRW")).toEqual({ unit: 1, value: 1400 });
    expect(defaultRate("VND", "KRW")).toEqual({ unit: 100, value: 5.5 });
  });

  it("기준 화폐가 원이 아니면 그 통화로 바꾼다", () => {
    expect(defaultRate("USD", "JPY")).toEqual({ unit: 1, value: 152.174 });
    expect(defaultRate("KRW", "JPY")).toEqual({ unit: 100, value: 10.8696 });
  });

  it("목록에 없는 통화면 null", () => {
    expect(defaultRate("XYZ", "KRW")).toBeNull();
    expect(defaultRate("USD", "XYZ")).toBeNull();
  });
});

describe("searchCurrencies", () => {
  it("나라 · 이름 · 코드(대소문자 없이)로 찾는다", () => {
    expect(searchCurrencies("베트").map((c) => c.code)).toEqual(["VND"]);
    expect(searchCurrencies("페소").map((c) => c.code)).toEqual(["MXN", "PHP"]);
    expect(searchCurrencies("usd").map((c) => c.code)).toEqual(["USD"]);
    expect(searchCurrencies(" ")).toHaveLength(CURRENCIES.length);
  });
});
