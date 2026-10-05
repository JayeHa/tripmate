import { describe, expect, it } from "vitest";

import type { ExpenseWithSplits } from "../model/types";
import { formValuesOf } from "./form-values";

const saved: ExpenseWithSplits = {
  id: "e1",
  trip_id: "t",
  schedule_item_id: "s1",
  payer_id: "a",
  amount: 12400,
  currency: "JPY",
  category: "shopping",
  name: "돈키호테 시부야",
  memo: null,
  spent_on: null,
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
    { expense_id: "e1", user_id: "a", share: 6200 },
    { expense_id: "e1", user_id: "b", share: 6200 },
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
      payer_id: "a",
      participant_ids: ["a", "b"],
      split_mode: "equal",
      custom_shares: undefined,
      category: "shopping",
      memo: undefined,
      spent_on: null,
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
        { expense_id: "e1", user_id: "a", share: 7000 },
        { expense_id: "e1", user_id: "b", share: 5400 },
      ],
    });
    expect(custom.split_mode).toBe("custom");
    expect(custom.custom_shares).toEqual({ a: 7000, b: 5400 });
  });
});
