import { describe, expect, it } from "vitest";

import type { ExpenseFormValues } from "@/entities/expense";
import type { Trip } from "@/entities/trip";

import { startValues } from "./start-values";

const trip = { start_date: "2026-10-31" } as Trip;
const base = { trip, currencies: ["KRW", "JPY"], me: "m:a" };

const saved: ExpenseFormValues = {
  name: "숙소",
  amount: 466240,
  currency: "KRW",
  rate: null,
  payment_method: "card",
  payer: { kind: "member", id: "b" },
  split_each: false,
  participants: [
    { kind: "member", id: "a" },
    { kind: "member", id: "b" },
  ],
  split_mode: "custom",
  custom_shares: { a: 200000, b: 266240 },
  category: "lodging",
  memo: undefined,
  spent_on: null,
  schedule_item_id: null,
  counted: false,
  paid: false,
  due_date: "2026-10-20",
};

describe("startValues", () => {
  it("새 지출 — 마지막 통화 · 현금 · 내가 결제 · 모두와 나눔(null) · 여행 첫날, 카테고리는 비운다", () => {
    expect(startValues(base)).toEqual({
      name: "",
      amount: "",
      currency: "JPY",
      rate: null,
      paymentMethod: "cash",
      payer: "m:a",
      splitEach: false,
      participants: null,
      category: null,
      memo: "",
      spentOn: "2026-10-31",
      itemId: "",
      paid: true,
      dueDate: "",
      counted: true,
    });
  });

  it("저장된 지출 — 금액은 문자열로, 날짜 없음(여행준비 · 예정일 없음)은 빈 글로", () => {
    expect(startValues({ ...base, initial: saved })).toEqual({
      name: "숙소",
      amount: "466240",
      currency: "KRW",
      rate: null,
      paymentMethod: "card",
      payer: "m:b",
      splitEach: false,
      participants: ["m:a", "m:b"],
      category: "lodging",
      memo: "",
      spentOn: "",
      itemId: "",
      paid: false,
      dueDate: "2026-10-20",
      counted: false,
    });
  });

  it("각자 냄 — 결제한 사람이 없다", () => {
    const each = startValues({ ...base, initial: { ...saved, payer: null, split_each: true } });
    expect(each).toMatchObject({ payer: null, splitEach: true });
  });
});
