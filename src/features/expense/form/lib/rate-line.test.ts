import { describe, expect, it } from "vitest";

import { homeAmountOrNull, rateLine } from "./rate-line";

const rates = { JPY: { unit: 100, value: 920 }, USD: { unit: 1, value: 1400 } };

describe("rateLine", () => {
  it("기준 화폐면 null", () => {
    expect(rateLine("KRW", "KRW", rates, null)).toBeNull();
  });

  it("여행 기본 환율 — 그 통화의 기준 단위 값", () => {
    expect(rateLine("JPY", "KRW", rates, null)).toBe("엔 920 기준");
    expect(rateLine("USD", "KRW", rates, null)).toBe("달러 1,400 기준");
  });

  it("이 지출에만 적은 환율 — 기준 단위로 바꿔 보이고, 기본과 같으면 「기준」", () => {
    expect(rateLine("JPY", "KRW", rates, 9.05)).toBe("엔 905 · 이 비용만");
    expect(rateLine("JPY", "KRW", rates, 9.2)).toBe("엔 920 기준");
  });

  it("환율이 없으면 알린다", () => {
    expect(rateLine("EUR", "KRW", rates, null)).toBe("유로 환율이 없어요");
  });
});

describe("homeAmountOrNull", () => {
  it("기준 화폐로 바꾼다 — 이 지출의 환율이 먼저", () => {
    expect(homeAmountOrNull(1000, "JPY", null, "KRW", rates)).toBe(9200);
    expect(homeAmountOrNull(1000, "JPY", 9, "KRW", rates)).toBe(9000);
    expect(homeAmountOrNull(500, "KRW", null, "KRW", rates)).toBe(500);
  });

  it("환율이 없으면 null", () => {
    expect(homeAmountOrNull(10, "EUR", null, "KRW", rates)).toBeNull();
  });
});
