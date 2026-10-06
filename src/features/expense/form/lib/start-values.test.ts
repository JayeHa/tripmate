import { describe, expect, it } from "vitest";

import type { ExpenseFormValues } from "@/entities/expense";
import type { Trip } from "@/entities/trip";

import { startValues } from "./start-values";

const trip = { start_date: "2026-10-31" } as Trip;
const base = { trip, currencies: ["KRW", "JPY"], memberIds: ["a", "b"], currentUserId: "a" };

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
  it("새 지출 — 마지막 통화 · 내가 결제 · 모두 나눔 · 식비 · 여행 첫날, 칸 없는 값은 기본값", () => {
    expect(startValues(base)).toEqual({
      name: "",
      amount: "",
      currency: "JPY",
      payerId: "a",
      participants: ["a", "b"],
      splitMode: "equal",
      custom: {},
      category: "food",
      memo: "",
      spentOn: "2026-10-31",
      itemId: "",
      kept: {
        split_each: false,
        rate: null,
        payment_method: "cash",
        counted: true,
        paid: true,
        due_date: null,
      },
    });
  });

  it("저장된 지출 — 숫자는 문자열로, 여행준비(날짜 없음)는 빈 글로, 칸 없는 값은 그대로 들고 있다", () => {
    expect(startValues({ ...base, initial: saved })).toEqual({
      name: "숙소",
      amount: "466240",
      currency: "KRW",
      payerId: "m:b",
      participants: ["m:a", "m:b"],
      splitMode: "custom",
      custom: { a: "200000", b: "266240" },
      category: "lodging",
      memo: "",
      spentOn: "",
      itemId: "",
      kept: {
        split_each: false,
        rate: null,
        payment_method: "card",
        counted: false,
        paid: false,
        due_date: "2026-10-20",
      },
    });
  });
});
