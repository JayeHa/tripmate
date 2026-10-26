import { describe, expect, it } from "vitest";

import {
  addAmount,
  convertAmount,
  liveRateValue,
  parseRate,
  pressKey,
  quickAmounts,
  rateSaveError,
} from "./calculator";

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

describe("parseRate", () => {
  it("양수 · 소수 넷째 자리까지만", () => {
    expect(parseRate("920")).toBe(920);
    expect(parseRate(" 844.5 ")).toBe(844.5);
    expect(parseRate("0.0551")).toBe(0.0551);
    expect(parseRate("")).toBeNull();
    expect(parseRate("0")).toBeNull();
    expect(parseRate("1.23456")).toBeNull();
    expect(parseRate("-3")).toBeNull();
    expect(parseRate("9,200")).toBeNull();
  });
});

describe("liveRateValue", () => {
  it("기준 화폐 자릿수로 둥글린다", () => {
    expect(liveRateValue(844.16, "KRW")).toBe(844);
    expect(liveRateValue(0.6512, "USD")).toBe(0.65);
  });
});

describe("rateSaveError", () => {
  it("오프라인 · 기준 화폐가 바뀜 · 통화가 지워짐 · 그 밖", () => {
    const offline = Object.assign(new Error("오프라인이에요. 연결되면 다시 해 주세요"), {
      name: "OfflineError",
    });
    expect(rateSaveError(offline)).toBe("오프라인이에요. 연결되면 다시 해 주세요");
    expect(rateSaveError(new Error("home currency changed by someone else"))).toMatch(
      /기준 화폐를 바꿨어요/,
    );
    expect(rateSaveError(new Error("currency not in trip"))).toMatch(/통화를 지웠어요/);
    expect(rateSaveError(new Error("boom"))).toBe("환율을 바꾸지 못했어요. 다시 시도해 주세요.");
  });
});
