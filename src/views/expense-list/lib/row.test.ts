import { describe, expect, it } from "vitest";

import type { ExpenseWithSplits, PersonRef } from "@/entities/expense";

import { expenseRowView } from "./row";

const ctx = {
  home: "KRW",
  rates: { JPY: { unit: 100, value: 920 } },
  today: "2026-10-05",
  nameOf: (person: PersonRef) => ({ me: "나", k: "김동규" })[person.id] ?? "알 수 없음",
  linkNameOf: (id: string) => (id === "s1" ? "텐동 카네코 한노스케" : null),
};

const base = {
  id: "e1",
  name: "텐동",
  category: "food",
  amount: 3200,
  currency: "JPY",
  rate: null,
  payer_id: "k",
  payer_guest_id: null,
  split_each: false,
  paid: true,
  due_date: null,
  counted: true,
  schedule_item_id: "s1",
  splits: [
    { id: "s1", expense_id: "e1", trip_id: "t", user_id: "me", guest_id: null, share: 1600 },
    { id: "s2", expense_id: "e1", trip_id: "t", user_id: "k", guest_id: null, share: 1600 },
  ],
} as unknown as ExpenseWithSplits;

describe("expenseRowView", () => {
  it("외화 — 근사치 · 여행 기본 환율 · 사람 · 연결 일정", () => {
    expect(expenseRowView(base, ctx)).toMatchObject({
      name: "텐동",
      categoryLabel: "식비",
      amountText: "¥3,200",
      approxText: "≈ ₩29,440",
      rateText: "(¥100 = ₩920)",
      payer: { person: { kind: "member", id: "k" }, name: "김동규" },
      together: "나, 김동규",
      togetherPeople: [
        { person: { kind: "member", id: "me" }, name: "나" },
        { person: { kind: "member", id: "k" }, name: "김동규" },
      ],
      planned: false,
      overdue: false,
      excluded: false,
      linkName: "텐동 카네코 한노스케",
    });
  });

  it("지출에 적은 환율이 있으면 그 환율로", () => {
    const row = expenseRowView({ ...base, amount: 12400, rate: 8.883 }, ctx);
    expect(row.approxText).toBe("≈ ₩110,149");
    expect(row.rateText).toBe("(¥100 = ₩888)");
  });

  it("기준 화폐면 근사치 · 환율이 없다, 환율을 모르면 「환율 없음」", () => {
    expect(expenseRowView({ ...base, currency: "KRW", amount: 466240 }, ctx)).toMatchObject({
      amountText: "₩466,240",
      approxText: null,
      rateText: null,
    });
    expect(expenseRowView({ ...base, currency: "USD", amount: 12.5 }, ctx)).toMatchObject({
      approxText: "환율 없음",
      rateText: null,
    });
  });

  it("결제 예정 — 예정일이 오늘보다 앞이면 지남, 합계 제외 · 연결 없음", () => {
    const row = expenseRowView(
      { ...base, paid: false, due_date: "2026-10-01", counted: false, schedule_item_id: null },
      ctx,
    );
    expect(row).toMatchObject({ planned: true, overdue: true, excluded: true, linkName: null });
    expect(expenseRowView({ ...base, paid: false, due_date: "2026-10-05" }, ctx).overdue).toBe(
      false,
    );
  });
});
