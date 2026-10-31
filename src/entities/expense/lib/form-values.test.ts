import { describe, expect, it } from "vitest";

import type { ExpenseWithSplits } from "../model/types";
import { formValuesOf } from "./form-values";

const saved: ExpenseWithSplits = {
  id: "e1",
  trip_id: "t",
  schedule_item_id: "s1",
  stay_id: null,
  flight_id: null,
  payer_id: "a",
  payer_guest_id: null,
  split_each: false,
  amount: 12400,
  currency: "JPY",
  category: "shopping",
  name: "돈키호테 시부야",
  memo: null,
  spent_on: null,
  spent_time: null,
  payment_method: "card",
  rate: 8.883,
  counted: false,
  paid: false,
  due_date: "2026-10-20",
  split_mode: "equal",
  created_by: "a",
  created_at: "",
  updated_at: "",
  splits: [
    { id: "s1", expense_id: "e1", trip_id: "t", user_id: "a", guest_id: null, share: 6200 },
    { id: "s2", expense_id: "e1", trip_id: "t", user_id: "b", guest_id: null, share: 6200 },
  ],
};

describe("formValuesOf", () => {
  it("저장된 칸을 그대로 옮긴다 — 여행준비(날짜 없음) · 지출별 환율 · 합계 제외 · 결제 예정", () => {
    expect(formValuesOf(saved)).toEqual({
      name: "돈키호테 시부야",
      amount: 12400,
      currency: "JPY",
      rate: 8.883,
      payment_method: "card",
      payer: { kind: "member", id: "a" },
      split_each: false,
      participants: [
        { kind: "member", id: "a" },
        { kind: "member", id: "b" },
      ],
      split_mode: "equal",
      custom_shares: undefined,
      category: "shopping",
      memo: undefined,
      spent_on: null,
      spent_time: null,
      schedule_item_id: "s1",
      counted: false,
      paid: false,
      due_date: "2026-10-20",
    });
  });

  it("직접 나눈 지출은 사람마다의 몫을 함께 옮긴다", () => {
    const custom = formValuesOf({
      ...saved,
      split_mode: "custom",
      splits: [
        { id: "s1", expense_id: "e1", trip_id: "t", user_id: "a", guest_id: null, share: 7000 },
        { id: "s2", expense_id: "e1", trip_id: "t", user_id: "b", guest_id: null, share: 5400 },
      ],
    });
    expect(custom.split_mode).toBe("custom");
    expect(custom.custom_shares).toEqual({ "m:a": 7000, "m:b": 5400 });
  });

  it("시각은 「HH:MM」 으로 옮긴다", () => {
    expect(
      formValuesOf({ ...saved, spent_on: "2026-10-31", spent_time: "14:20:00" }).spent_time,
    ).toBe("14:20");
  });
});
