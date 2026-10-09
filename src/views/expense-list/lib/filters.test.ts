import { describe, expect, it } from "vitest";

import type { ExpenseWithSplits } from "@/entities/expense";

import { filtersActive, matchesFilters, moreCount, moreGroups, NO_FILTERS } from "./filters";

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
    currency: "KRW",
    splits: [{ user_id: "a", guest_id: null }],
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

  it("결제 통화 · 함께한 사람(고른 사람 중 한 명이라도)", () => {
    expect(matchesFilters(expense(), { ...NO_FILTERS, currency: "JPY" })).toBe(false);
    expect(matchesFilters(expense(), { ...NO_FILTERS, currency: "KRW" })).toBe(true);
    expect(matchesFilters(expense(), { ...NO_FILTERS, together: ["g:x", "m:a"] })).toBe(true);
    expect(matchesFilters(expense(), { ...NO_FILTERS, together: ["g:x"] })).toBe(false);
  });
});

describe("filtersActive · moreCount", () => {
  it("하나라도 걸리면 true", () => {
    expect(filtersActive(NO_FILTERS)).toBe(false);
    expect(filtersActive({ ...NO_FILTERS, payers: ["m:a"] })).toBe(true);
    expect(filtersActive({ ...NO_FILTERS, hideExcluded: true })).toBe(true);
  });

  it("더보기 안에서 걸린 필터 수 — 함께한 사람은 여럿 골라도 하나", () => {
    expect(moreCount({ ...NO_FILTERS, categories: ["food"] })).toBe(0);
    expect(
      moreCount({ ...NO_FILTERS, currency: "JPY", together: ["m:a", "m:b"], status: "planned" }),
    ).toBe(3);
  });
});

describe("moreGroups", () => {
  it("걸 거리가 있는 묶음만 — 통화 2개 이상 · 일행 · 결제 예정 · 합계 제외", () => {
    expect(moreGroups([expense()], true)).toEqual({
      currencies: null,
      together: false,
      status: false,
      excluded: false,
    });
    const all = [expense(), expense({ currency: "JPY", paid: false, counted: false })];
    expect(moreGroups(all, false)).toEqual({
      currencies: ["KRW", "JPY"],
      together: true,
      status: true,
      excluded: true,
    });
  });
});
