import { describe, expect, it } from "vitest";

import { cleanAmount, formatAmountDraft } from "./amount-draft";

describe("cleanAmount", () => {
  it("정수 통화는 숫자만 — 쉼표 · 점 · 글자를 버린다", () => {
    expect(cleanAmount("12,000", 0)).toBe("12000");
    expect(cleanAmount("1.5", 0)).toBe("15");
    expect(cleanAmount("3천", 0)).toBe("3");
  });

  it("소수 통화는 점 하나와 그 통화의 소수 자리까지", () => {
    expect(cleanAmount("12.505", 2)).toBe("12.50");
    expect(cleanAmount("1.2.3", 2)).toBe("1.23");
    expect(cleanAmount("12.", 2)).toBe("12.");
    expect(cleanAmount(".5", 2)).toBe("0.5");
  });

  it("앞의 0 은 떼고 정수는 10자리까지", () => {
    expect(cleanAmount("007", 0)).toBe("7");
    expect(cleanAmount("0.5", 2)).toBe("0.5");
    expect(cleanAmount("123456789012", 0)).toBe("1234567890");
  });
});

describe("formatAmountDraft", () => {
  it("천 단위 쉼표, 소수 부분은 그대로", () => {
    expect(formatAmountDraft("1234567")).toBe("1,234,567");
    expect(formatAmountDraft("12000.5")).toBe("12,000.5");
    expect(formatAmountDraft("12.")).toBe("12.");
    expect(formatAmountDraft("")).toBe("");
  });
});
