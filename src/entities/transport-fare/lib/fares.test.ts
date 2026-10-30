import { describe, expect, it } from "vitest";

import type { TransportFare } from "../model/types";
import { cleanDraft, dayFare, extraFares, fareTotals, isEmptyDraft } from "./fares";

/** 테스트용 줄 — 날짜 줄이 기본 */
function fare(fields: Partial<TransportFare>): TransportFare {
  return {
    id: crypto.randomUUID(),
    trip_id: "t",
    day_index: 0,
    title: null,
    amount: null,
    currency: "JPY",
    memo: null,
    created_at: "",
    updated_at: "",
    ...fields,
  };
}

describe("교통비 줄", () => {
  const fares = [
    fare({ day_index: 0, amount: 900 }),
    fare({ day_index: 1, amount: 1160 }),
    fare({ day_index: 2, memo: "전부 도보" }),
    fare({ day_index: 5, amount: 300 }),
    fare({ day_index: null, title: "공항 왕복", amount: 5500 }),
    fare({ day_index: null, title: "환전", amount: 20000, currency: "KRW" }),
  ];

  it("그날 줄 · 날짜 밖 줄을 고른다", () => {
    expect(dayFare(fares, 1)?.amount).toBe(1160);
    expect(dayFare(fares, 3)).toBeNull();
    expect(extraFares(fares).map((f) => f.title)).toEqual(["공항 왕복", "환전"]);
  });

  it("합계는 통화마다 — 기간 밖 날짜 줄 · 금액 없는 줄은 빼고 날짜 밖 줄은 넣는다", () => {
    expect(fareTotals(fares, 5)).toEqual([
      { currency: "JPY", amount: 7560 },
      { currency: "KRW", amount: 20000 },
    ]);
    expect(fareTotals([fare({ memo: "x" })], 5)).toEqual([]);
  });

  it("DB 가 numeric 을 글자로 돌려줘도 숫자로 더한다", () => {
    const text = [fare({ amount: "1.5" as unknown as number }), fare({ day_index: 1, amount: 2 })];
    expect(fareTotals(text, 5)).toEqual([{ currency: "JPY", amount: 3.5 }]);
  });

  it("메모는 공백을 떼고 비면 null, 금액 · 메모가 모두 없으면 빈 값", () => {
    expect(cleanDraft({ amount: 1, currency: "JPY", memo: "  " })).toEqual({
      amount: 1,
      currency: "JPY",
      memo: null,
    });
    expect(isEmptyDraft({ amount: null, currency: "JPY", memo: " " })).toBe(true);
    expect(isEmptyDraft({ amount: 0, currency: "JPY", memo: null })).toBe(false);
  });
});
