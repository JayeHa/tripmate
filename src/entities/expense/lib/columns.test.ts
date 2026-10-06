import { describe, expect, it } from "vitest";

import type { ExpenseFormValues } from "../model/schema";
import { insertColumns, sharesChanged, updateColumns } from "./columns";

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
  it("연 때와 달라진 칸만 보낸다", () => {
    const cols = updateColumns({ ...values, memo: "웨이팅 30분", paid: false }, values);
    expect(cols).toEqual({ memo: "웨이팅 30분", paid: false, due_date: null });
  });

  it("고치지 않은 칸은 보내지 않아, 그사이 일행이 바꾼 값을 되돌리지 않는다", () => {
    // 연 뒤 일행이 「결제 완료로」 · 대체 장소 「바꾸기」 를 해도 폼 값은 연 때 그대로다
    const opened = { ...values, paid: false, counted: true };
    expect(updateColumns({ ...opened, name: "돈키호테" }, opened)).toEqual({ name: "돈키호테" });
  });

  it("몫을 다시 쓰면 금액 · 통화 · 환율 · 나눔 방식을 한 묶음으로 — 그사이 일행이 바꾼 금액과 몫이 어긋나지 않게", () => {
    const fewer = { ...values, participants: [values.participants[0]] };
    expect(updateColumns(fewer, values)).toEqual({
      amount: 12400,
      currency: "JPY",
      rate: 8.883,
      split_mode: "equal",
    });
  });

  it("통화를 바꾸며 폼이 비운 환율도 함께 보낸다", () => {
    expect(updateColumns({ ...values, currency: "KRW", rate: null }, values)).toMatchObject({
      currency: "KRW",
      rate: null,
    });
  });

  it("결제자 · 각자 냄은 한 묶음 — 하나만 바뀌어도 셋을 함께 보낸다(그사이 일행이 각자 냄으로 바꿔도 제약에 안 걸리게)", () => {
    expect(updateColumns({ ...values, payer: { kind: "member", id: "b" } }, values)).toEqual({
      payer_id: "b",
      payer_guest_id: null,
      split_each: false,
    });
    expect(updateColumns({ ...values, payer: null, split_each: true }, values)).toEqual({
      payer_id: null,
      payer_guest_id: null,
      split_each: true,
    });
  });

  it("결제 상태 · 예정일은 한 묶음 — 예정일만 고쳐도 결제 상태를 함께 보낸다", () => {
    const planned = { ...values, paid: false, due_date: "2026-10-20" };
    expect(updateColumns({ ...planned, due_date: "2026-10-25" }, planned)).toEqual({
      paid: false,
      due_date: "2026-10-25",
    });
  });
});

describe("sharesChanged", () => {
  const custom: ExpenseFormValues = {
    ...values,
    split_mode: "custom",
    custom_shares: { "m:a": 8000, "m:b": 4400 },
  };

  it("금액 · 통화 · 함께한 사람이 그대로면 몫을 다시 쓰지 않는다 — 함께한 사람 순서는 보지 않는다", () => {
    const reordered = {
      ...values,
      split_mode: "equal" as const,
      participants: [...custom.participants].reverse(),
      memo: "메모",
    };
    expect(sharesChanged(reordered, custom)).toBe(false);
  });

  it("셋 중 하나라도 바뀌면 다시 쓴다", () => {
    expect(sharesChanged({ ...values, amount: 13000 }, values)).toBe(true);
    expect(sharesChanged({ ...values, currency: "KRW" }, values)).toBe(true);
    expect(sharesChanged({ ...values, participants: [values.participants[0]] }, values)).toBe(true);
  });

  it("예전 직접 나누기 지출 — 몫을 안 건드리는 수정이면 나눔 방식도 보내지 않는다", () => {
    const edit = {
      ...custom,
      split_mode: "equal" as const,
      custom_shares: undefined,
      memo: "메모",
    };
    expect(updateColumns(edit, custom)).toEqual({ memo: "메모" });
    expect(updateColumns({ ...edit, amount: 13000 }, custom)).toMatchObject({
      split_mode: "equal",
    });
  });
});
