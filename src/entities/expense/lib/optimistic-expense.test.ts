import { describe, expect, it } from "vitest";

import type { ExpenseCreateVars } from "../model/expense-sync";
import type { ExpenseFormValues } from "../model/schema";
import { optimisticExpense } from "./optimistic-expense";
import { resolveShares } from "./shares";

const values: ExpenseFormValues = {
  name: "라멘",
  amount: 3000,
  currency: "JPY",
  rate: null,
  payment_method: "card",
  payer: { kind: "member", id: "me" },
  split_each: false,
  participants: [
    { kind: "member", id: "me" },
    { kind: "guest", id: "g1" },
  ],
  split_mode: "equal",
  category: "food",
  memo: "",
  spent_on: "2026-10-31",
  schedule_item_id: null,
  counted: true,
  paid: true,
  due_date: null,
};

const vars: ExpenseCreateVars = {
  tripId: "t1",
  id: "e1",
  values,
  createdBy: "me",
  createdAt: "2026-10-31T03:00:00.000Z",
};

describe("optimisticExpense", () => {
  it("폼 값으로 목록에 바로 보일 지출을 만든다 — 몫은 사람마다 한 줄, 빈 메모는 null", () => {
    const row = optimisticExpense(vars, resolveShares(values));
    expect(row).toMatchObject({
      id: "e1",
      trip_id: "t1",
      name: "라멘",
      amount: 3000,
      payer_id: "me",
      payer_guest_id: null,
      memo: null,
      created_by: "me",
      created_at: vars.createdAt,
      updated_at: vars.createdAt,
      stay_id: null,
      flight_id: null,
    });
    expect(row.splits).toHaveLength(2);
    expect(row.splits).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ expense_id: "e1", user_id: "me", guest_id: null, share: 1500 }),
        expect.objectContaining({ expense_id: "e1", user_id: null, guest_id: "g1", share: 1500 }),
      ]),
    );
    // 나눔 줄 id 는 서로 다르다(화면 key)
    expect(new Set(row.splits.map((s) => s.id)).size).toBe(2);
  });
});
