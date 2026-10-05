import { describe, expect, it } from "vitest";

import type { ExpenseFormValues } from "../model/schema";
import { insertColumns, updateColumns } from "./columns";

const values: ExpenseFormValues = {
  name: "돈키호테 시부야",
  amount: 12400,
  currency: "JPY",
  rate: 8.883,
  payment_method: "card",
  payer_id: "a",
  participant_ids: ["a", "b"],
  split_mode: "equal",
  category: "shopping",
  memo: "",
  spent_on: null,
  schedule_item_id: "s1",
  counted: true,
  paid: true,
  due_date: null,
};

describe("insertColumns", () => {
  it("폼이 다루지 않는 값도 넣는다 — 빈 메모는 null, 결제 완료면 예정일을 비운다", () => {
    expect(insertColumns({ ...values, due_date: "2026-10-20" })).toMatchObject({
      memo: null,
      rate: 8.883,
      payment_method: "card",
      counted: true,
      paid: true,
      due_date: null,
    });
  });
});

describe("updateColumns", () => {
  it("폼이 칸으로 다루는 값만 보낸다 — 합계 포함 · 결제 상태 · 결제수단 · 환율은 서버 값을 둔다", () => {
    const cols = updateColumns(values, "JPY");
    for (const key of ["counted", "paid", "due_date", "payment_method", "rate"]) {
      expect(cols).not.toHaveProperty(key);
    }
    expect(cols).toMatchObject({ name: "돈키호테 시부야", spent_on: null, schedule_item_id: "s1" });
  });

  it("통화를 바꿨으면 그 지출의 환율을 비운다", () => {
    expect(updateColumns({ ...values, currency: "KRW" }, "JPY")).toMatchObject({ rate: null });
  });
});
