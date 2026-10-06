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
  it("칸이 없는 환율도 넣는다 — 빈 메모는 null, 결제 완료면 예정일을 비운다", () => {
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
  it("연 때와 달라진 칸만 보낸다 — 칸이 없는 환율은 보내지 않는다", () => {
    const cols = updateColumns({ ...values, memo: "웨이팅 30분", paid: false }, values);
    expect(cols).toEqual({ memo: "웨이팅 30분", paid: false });
  });

  it("고치지 않은 칸은 보내지 않아, 그사이 일행이 바꾼 값을 되돌리지 않는다", () => {
    // 연 뒤 일행이 「결제 완료로」 · 대체 장소 「바꾸기」 를 해도 폼 값은 연 때 그대로다
    const opened = { ...values, paid: false, counted: true };
    expect(updateColumns({ ...opened, name: "돈키호테" }, opened)).toEqual({ name: "돈키호테" });
  });

  it("통화를 바꿨으면 그 지출의 환율을 비운다", () => {
    expect(updateColumns({ ...values, currency: "KRW" }, values)).toEqual({
      currency: "KRW",
      rate: null,
    });
  });

  it("결제자 · 각자 냄은 칸 단위로 — 결제자 두 칸 중 바뀐 것만", () => {
    expect(updateColumns({ ...values, payer: null, split_each: true }, values)).toEqual({
      payer_id: null,
      split_each: true,
    });
    expect(updateColumns({ ...values, payer: { kind: "guest", id: "g1" } }, values)).toEqual({
      payer_id: null,
      payer_guest_id: "g1",
    });
  });
});
