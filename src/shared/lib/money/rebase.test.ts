import { describe, expect, it } from "vitest";

import { appliedFactor, rebaseFactor, rebaseRates } from "./rebase";

const KRW_RATES = { JPY: { unit: 100, value: 855 }, USD: { unit: 1, value: 1400 } };

describe("rebaseFactor", () => {
  it("새 기준 1단위의 옛 기준 값, 옛 환율에 없으면 null", () => {
    expect(rebaseFactor(KRW_RATES, "JPY")).toBe(8.55);
    expect(rebaseFactor(KRW_RATES, "USD")).toBe(1400);
    expect(rebaseFactor(KRW_RATES, "EUR")).toBeNull();
  });
});

describe("rebaseRates", () => {
  it("원 → 엔: 다른 통화는 ÷, 엔 줄은 빼고 원 줄을 100 단위로 더한다", () => {
    expect(rebaseRates(KRW_RATES, "KRW", "JPY", 8.55)).toEqual({
      USD: { unit: 1, value: 163.74269 },
      KRW: { unit: 100, value: 11.695906 },
    });
  });

  it("원 → 달러: 엔은 100엔 단위 그대로, 원은 100원 단위", () => {
    expect(rebaseRates(KRW_RATES, "KRW", "USD", 1400)).toEqual({
      JPY: { unit: 100, value: 0.61071429 },
      KRW: { unit: 100, value: 0.071428571 },
    });
  });

  it("옛 기준이 새 기준보다 크면(달러 → 원) 옛 기준은 1 단위", () => {
    const usd = { KRW: { unit: 100, value: 0.071429 } };
    const factor = 0.071429 / 100;
    expect(rebaseRates(usd, "USD", "KRW", factor).USD).toEqual({ unit: 1, value: 1399.9916 });
  });

  it("아주 작은 환율도 유효 숫자로 남는다(0 이 되지 않는다)", () => {
    const krw = { VND: { unit: 1, value: 0.055 }, USD: { unit: 1, value: 1400 } };
    expect(rebaseRates(krw, "KRW", "USD", 1400).VND).toEqual({ unit: 1, value: 0.000039285714 });
  });
});

describe("appliedFactor", () => {
  it("저장할 옛 기준 줄에서 거꾸로 — 원화 지출과 송금 기록이 같은 값으로 바뀐다", () => {
    const rebased = rebaseRates(KRW_RATES, "KRW", "JPY", 8.55);
    const f = appliedFactor(rebased, "KRW");
    // ₩1,000,000 원화 지출(여행 환율로 계산) = 같은 금액의 송금 기록(÷ f)
    const expense = (1_000_000 * rebased.KRW.value) / rebased.KRW.unit;
    expect(1_000_000 / f).toBeCloseTo(expense, 6);
  });
});
