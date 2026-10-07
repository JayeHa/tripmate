import { describe, expect, it } from "vitest";

import type { ExpenseWithSplits } from "@/entities/expense";

import { categoryShares, hasSharedExpense, topCategories, transferRows } from "./dashboard";

const rates = { JPY: { unit: 100, value: 900 } };

/** 테스트 지출 — 나눈 사람 수만큼 몫을 둔다 */
function expense(
  category: string,
  amount: number,
  opts: Partial<ExpenseWithSplits> & { people?: number } = {},
): ExpenseWithSplits {
  const people = opts.people ?? 1;
  return {
    category,
    amount,
    currency: "KRW",
    rate: null,
    payer_id: "u0",
    payer_guest_id: null,
    counted: true,
    split_each: false,
    splits: Array.from({ length: people }, (_, i) => ({ user_id: `u${i}`, guest_id: null })),
    ...opts,
  } as unknown as ExpenseWithSplits;
}

describe("categoryShares", () => {
  it("큰 것부터, 비율은 반올림, 합계 제외 · 0 은 빠진다", () => {
    const shares = categoryShares(
      [
        expense("food", 3000),
        expense("lodging", 6000),
        expense("food", 1000),
        expense("shopping", 9000, { counted: false }),
      ],
      "KRW",
      rates,
    );
    expect(shares).toEqual([
      { category: "lodging", total: 6000, percent: 60 },
      { category: "food", total: 4000, percent: 40 },
    ]);
  });

  it("외화는 기준 화폐로, 환율을 모르는 지출은 빼고 센다", () => {
    const shares = categoryShares(
      [expense("food", 1000, { currency: "JPY" }), expense("other", 5, { currency: "USD" })],
      "KRW",
      rates,
    );
    expect(shares).toEqual([{ category: "food", total: 9000, percent: 100 }]);
  });

  it("모르는 카테고리는 기타로", () => {
    expect(categoryShares([expense("misc", 100)], "KRW", rates)[0].category).toBe("other");
  });
});

describe("topCategories", () => {
  it("위 3개와 그 외 합계", () => {
    const shares = ["food", "lodging", "flight", "shopping", "other"].map((c, i) => ({
      category: c as never,
      total: 50 - i * 10,
      percent: 0,
    }));
    const { top, rest } = topCategories(shares);
    expect(top.map((s) => s.category)).toEqual(["food", "lodging", "flight"]);
    expect(rest).toEqual({ categories: ["shopping", "other"], total: 30 });
  });

  it("3개 이하면 그 외가 없다", () => {
    expect(topCategories([]).rest).toBeNull();
  });
});

describe("transferRows", () => {
  const remaining = [
    { from: "m:b", to: "m:c", amount: 100 },
    { from: "m:a", to: "m:c", amount: 200 },
  ];
  const sent = [{ from: "m:b", to: "m:a", amount: 50, id: "s1" }];

  it("남은 송금 다음에 보낸 송금, 보낸 것은 기록 id 가 key", () => {
    expect(transferRows(remaining, sent, "m:a").map((t) => [t.key, t.done])).toEqual([
      ["m:b>m:c", false],
      ["m:a>m:c", false],
      ["s1", true],
    ]);
  });

  it("PC 는 나와 주고받는 줄을 먼저", () => {
    expect(transferRows(remaining, sent, "m:a", true).map((t) => t.from)).toEqual([
      "m:a",
      "m:b",
      "m:b",
    ]);
  });
});

describe("hasSharedExpense", () => {
  it("결제한 사람 몫만 있거나 · 각자 냄 · 합계 제외면 아니다", () => {
    expect(hasSharedExpense([expense("food", 100)])).toBe(false);
    expect(hasSharedExpense([expense("food", 100, { people: 2, split_each: true })])).toBe(false);
    expect(hasSharedExpense([expense("food", 100, { people: 2, counted: false })])).toBe(false);
    expect(hasSharedExpense([expense("food", 100, { people: 2 })])).toBe(true);
  });

  it("남의 몫 하나만 대신 낸 지출도 정산이 생긴다", () => {
    expect(hasSharedExpense([expense("food", 100, { payer_id: "u9" })])).toBe(true);
  });
});
