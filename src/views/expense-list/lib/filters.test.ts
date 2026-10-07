import { describe, expect, it } from "vitest";

import type { ExpenseWithSplits } from "@/entities/expense";

import { chipLabel, filtersActive, matchesFilters, NO_FILTERS } from "./filters";

/** 필터가 보는 칸만 채운 비용 */
function expense(patch: Partial<ExpenseWithSplits> = {}): ExpenseWithSplits {
  return {
    category: "food",
    payment_method: "card",
    payer_id: "a",
    payer_guest_id: null,
    split_each: false,
    paid: true,
    counted: true,
    ...patch,
  } as ExpenseWithSplits;
}

describe("matchesFilters", () => {
  it("필터가 없으면 모두", () => {
    expect(matchesFilters(expense(), NO_FILTERS)).toBe(true);
  });

  it("카테고리 · 결제수단 · 결제한 사람은 고른 것 중 하나면 통과", () => {
    expect(matchesFilters(expense(), { ...NO_FILTERS, categories: ["food", "shopping"] })).toBe(
      true,
    );
    expect(matchesFilters(expense(), { ...NO_FILTERS, categories: ["shopping"] })).toBe(false);
    expect(matchesFilters(expense(), { ...NO_FILTERS, methods: ["cash"] })).toBe(false);
    expect(matchesFilters(expense(), { ...NO_FILTERS, payers: ["m:a"] })).toBe(true);
    expect(
      matchesFilters(expense({ payer_id: null, payer_guest_id: "g1" }), {
        ...NO_FILTERS,
        payers: ["g:g1"],
      }),
    ).toBe(true);
  });

  it("각자 냄은 결제한 사람이 없어 사람을 고르면 빠진다", () => {
    const each = expense({ payer_id: null, split_each: true });
    expect(matchesFilters(each, { ...NO_FILTERS, payers: ["m:a"] })).toBe(false);
  });

  it("결제 상태 · 합계 제외 숨기기", () => {
    expect(matchesFilters(expense({ paid: false }), { ...NO_FILTERS, status: "done" })).toBe(false);
    expect(matchesFilters(expense({ paid: false }), { ...NO_FILTERS, status: "planned" })).toBe(
      true,
    );
    expect(matchesFilters(expense({ counted: false }), { ...NO_FILTERS, hideExcluded: true })).toBe(
      false,
    );
  });
});

describe("filtersActive · chipLabel", () => {
  it("하나라도 걸리면 true", () => {
    expect(filtersActive(NO_FILTERS)).toBe(false);
    expect(filtersActive({ ...NO_FILTERS, hideExcluded: true })).toBe(true);
    expect(filtersActive({ ...NO_FILTERS, status: "planned" })).toBe(true);
  });

  it("고른 첫 이름 + 「외 N」", () => {
    expect(chipLabel("카테고리", [])).toBe("카테고리");
    expect(chipLabel("카테고리", ["식비"])).toBe("카테고리 · 식비");
    expect(chipLabel("카테고리", ["식비", "교통", "쇼핑"])).toBe("카테고리 · 식비 외 2");
  });
});
