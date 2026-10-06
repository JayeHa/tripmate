import { describe, expect, it } from "vitest";

import type { ExpenseFormValues } from "../model/schema";
import { insertColumns, updateColumns } from "./columns";

const values: ExpenseFormValues = {
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

  it("「각자 냄」 과 결제자는 저장된 값 그대로 — 폼이 들고 있던 값을 보낸다", () => {
    const each = updateColumns({ ...values, payer: null, split_each: true }, "JPY");
    expect(each).toMatchObject({ split_each: true, payer_id: null, payer_guest_id: null });
    const guest = updateColumns({ ...values, payer: { kind: "guest", id: "g1" } }, "JPY");
    expect(guest).toMatchObject({ split_each: false, payer_id: null, payer_guest_id: "g1" });
  });
});
