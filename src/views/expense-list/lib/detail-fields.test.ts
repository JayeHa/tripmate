import { describe, expect, it } from "vitest";

import { expenseRowView, type ExpenseWithSplits, type PersonRef } from "@/entities/expense";

import { detailFields } from "./detail-fields";

const trip = {
  start_date: "2026-10-29",
  end_date: "2026-11-02",
  home_currency: "KRW",
  exchange_rates: { JPY: { unit: 100, value: 920 } },
};

const names: Record<string, string> = { me: "정원", k: "동규", g: "서연" };

/** 테스트용 표시 이름 */
const displayNameOf = (person: PersonRef) => names[person.id] ?? "알 수 없음";

const base = {
  id: "e1",
  name: "텐동",
  category: "food",
  amount: 3200,
  currency: "JPY",
  rate: null,
  spent_on: "2026-10-30",
  payment_method: "card",
  memo: null,
  payer_id: "me",
  payer_guest_id: null,
  split_each: false,
  split_mode: "equal",
  paid: true,
  due_date: null,
  counted: true,
  schedule_item_id: null,
  splits: [
    { id: "s1", expense_id: "e1", trip_id: "t", user_id: "me", guest_id: null, share: 1600 },
    { id: "s2", expense_id: "e1", trip_id: "t", user_id: "k", guest_id: null, share: 1600 },
  ],
} as unknown as ExpenseWithSplits;

/** 줄 글을 만든 뒤 상세 표로 — 값만 label → value 로 */
function fieldsOf(e: ExpenseWithSplits, opts: { everyone?: number; meId?: string | null } = {}) {
  const row = expenseRowView(e, {
    home: trip.home_currency,
    rates: trip.exchange_rates,
    today: "2026-10-30",
    nameOf: displayNameOf,
    linkNameOf: (id) => (id === "s1" ? "텐동 카네코" : null),
  });
  const fields = detailFields(e, row, {
    trip,
    displayNameOf,
    everyone: opts.everyone ?? 3,
    meId: opts.meId === undefined ? "me" : opts.meId,
  });
  return Object.fromEntries(fields.map((f) => [f.label, f.muted ? `(${f.value})` : f.value]));
}

describe("detailFields", () => {
  it("날짜 · 카테고리 · 결제수단 · 결제(나) · 함께 + 1인 몫 · 빈 일정 · 빈 메모", () => {
    expect(fieldsOf(base)).toEqual({
      날짜: "day 2 · 10.30 (금)",
      카테고리: "식비",
      결제수단: "카드",
      결제: "정원 (나)",
      함께: "함께 · 정원, 동규 · 1인 ₩14,720",
      일정: "(연결 안 함)",
      메모: "(없음)",
    });
  });

  it("남이 결제했으면 「(나)」 없이, 연결 일정 · 메모가 있으면 그 값", () => {
    const f = fieldsOf({ ...base, payer_id: "k", schedule_item_id: "s1", memo: " 카드 할인 " });
    expect(f.결제).toBe("동규");
    expect(f.일정).toBe("텐동 카네코");
    expect(f.메모).toBe("카드 할인");
  });

  it("각자 냄", () => {
    expect(fieldsOf({ ...base, split_each: true, payer_id: null }).결제).toBe("각자 냄");
  });

  it("혼자면 1인 몫이 없다", () => {
    const solo = { ...base, splits: [base.splits[0]] } as ExpenseWithSplits;
    expect(fieldsOf(solo).함께).toBe("혼자");
  });

  it("직접 나눈 비용은 1인 몫을 보이지 않는다", () => {
    expect(fieldsOf({ ...base, split_mode: "custom" }).함께).toBe("함께 · 정원, 동규");
  });

  it("환율을 모르면 1인 몫을 빼고 보인다", () => {
    expect(fieldsOf({ ...base, currency: "USD" }).함께).toBe("함께 · 정원, 동규");
  });
});
