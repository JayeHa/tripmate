import { describe, expect, it } from "vitest";

import { perUnitLabel, rateDraftOf, rateFromDraft, rateUnit } from "./rate-draft";

const rates = { JPY: { unit: 100, value: 920 }, USD: { unit: 1, value: 1400 } };

describe("rateUnit · perUnitLabel", () => {
  it("여행 환율 단위, 없으면 1", () => {
    expect(rateUnit("JPY", rates)).toBe(100);
    expect(rateUnit("EUR", rates)).toBe(1);
    expect(perUnitLabel("JPY", rates)).toBe("100엔 당");
    expect(perUnitLabel("USD", rates)).toBe("1달러 당");
  });
});

describe("rateDraftOf", () => {
  it("이 비용 환율은 단위를 곱해, 없으면 여행 기본, 그것도 없으면 빈 칸", () => {
    expect(rateDraftOf("JPY", rates, 9.05)).toBe("905");
    expect(rateDraftOf("JPY", rates, null)).toBe("920");
    expect(rateDraftOf("EUR", rates, null)).toBe("");
  });
});

describe("rateFromDraft", () => {
  it("단위로 나눈 1단위 환율", () => {
    expect(rateFromDraft("905", "JPY", rates)).toBe(9.05);
    expect(rateFromDraft("1,450.5", "USD", rates)).toBe(1450.5);
  });

  it("여행 기본과 같으면 null(기본을 따른다)", () => {
    expect(rateFromDraft("920", "JPY", rates)).toBeNull();
  });

  it("비었거나 숫자가 아니거나 0 이하면 undefined", () => {
    expect(rateFromDraft("", "JPY", rates)).toBeUndefined();
    expect(rateFromDraft("abc", "JPY", rates)).toBeUndefined();
    expect(rateFromDraft("0", "JPY", rates)).toBeUndefined();
  });

  it("여행 환율이 없는 통화는 1단위 그대로", () => {
    expect(rateFromDraft("1500", "EUR", rates)).toBe(1500);
  });
});
