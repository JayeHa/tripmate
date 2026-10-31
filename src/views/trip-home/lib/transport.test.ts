import { describe, expect, it } from "vitest";

import type { TransportFare } from "@/entities/transport-fare";

import {
  amountDraft,
  homeApprox,
  parseAmount,
  startFareCurrency,
  totalsLabel,
  tripCurrencies,
} from "./transport";

/** 테스트용 줄 */
function fare(currency: string, updated_at: string): TransportFare {
  return {
    id: updated_at,
    trip_id: "t",
    day_index: null,
    title: "x",
    amount: 1,
    currency,
    memo: null,
    created_at: "",
    updated_at,
  };
}

const RATES = { JPY: { unit: 100, value: 920 } };

describe("교통 탭 계산", () => {
  it("여행 통화는 기준 통화가 맨 앞", () => {
    expect(tripCurrencies("KRW", RATES)).toEqual(["KRW", "JPY"]);
    expect(tripCurrencies("KRW", {})).toEqual(["KRW"]);
  });

  it("새 줄 통화 — 마지막에 고친 줄 → 첫 외화 → 기준 통화", () => {
    const currencies = ["KRW", "JPY", "USD"];
    expect(startFareCurrency(currencies, [fare("USD", "2"), fare("KRW", "1")])).toBe("USD");
    expect(startFareCurrency(currencies, [fare("EUR", "3")])).toBe("JPY");
    expect(startFareCurrency(["KRW"], [])).toBe("KRW");
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

  it("합계 줄 · 사람 수 · 기준 통화 어림값", () => {
    const totals = [{ currency: "JPY", amount: 2700 }];
    expect(totalsLabel(totals)).toBe("¥2,700");
    expect(totalsLabel(totals, 2)).toBe("¥5,400");
    expect(totalsLabel([])).toBeNull();
    expect(homeApprox(totals, "KRW", RATES)).toBe("≈ ₩24,840");
    expect(homeApprox([{ currency: "KRW", amount: 1 }], "KRW", RATES)).toBeNull();
    expect(homeApprox([{ currency: "USD", amount: 1 }], "KRW", RATES)).toBeNull();
  });
});
