import { describe, expect, it } from "vitest";

import { expenseFormSchema, type ExpenseFormValues } from "./schema";

const base: ExpenseFormValues = {
  name: "라멘",
  amount: 3200,
  currency: "JPY",
  rate: null,
  payment_method: "cash",
  payer: { kind: "member", id: "a" },
  split_each: false,
  participants: [{ kind: "member", id: "a" }],
  split_mode: "equal",
  category: "food",
  memo: undefined,
  spent_on: null,
  schedule_item_id: null,
  counted: true,
  paid: true,
  due_date: null,
};

describe("expenseFormSchema", () => {
  it("멤버 · 정산 인원 둘 다 결제자가 될 수 있다", () => {
    expect(expenseFormSchema.safeParse(base).success).toBe(true);
    expect(
      expenseFormSchema.safeParse({ ...base, payer: { kind: "guest", id: "g1" } }).success,
    ).toBe(true);
  });

  it("「각자 냄」 은 결제자가 없어야 한다 — 둘이 어긋나면 막는다", () => {
    expect(expenseFormSchema.safeParse({ ...base, payer: null, split_each: true }).success).toBe(
      true,
    );
    const withPayer = expenseFormSchema.safeParse({ ...base, split_each: true });
    expect(withPayer.success).toBe(false);
    const noPayer = expenseFormSchema.safeParse({ ...base, payer: null });
    expect(noPayer.success).toBe(false);
  });

  it("결제 완료면 예정일이 없어야 하고, 나눌 사람은 한 명 이상", () => {
    expect(expenseFormSchema.safeParse({ ...base, due_date: "2026-10-20" }).success).toBe(false);
    expect(expenseFormSchema.safeParse({ ...base, participants: [] }).success).toBe(false);
  });
});
