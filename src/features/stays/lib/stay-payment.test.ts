import { describe, expect, it } from "vitest";

import { stayPaymentView } from "./stay-payment";

const base = {
  amount: 32000,
  currency: "JPY",
  paid: true,
  due_date: null,
  split_each: false,
};

describe("stayPaymentView", () => {
  it("결제 완료 — 금액 · 결제한 사람 · 상태", () => {
    expect(stayPaymentView(base, "정원", "2026-10-11")).toEqual({
      amountText: "¥32,000",
      sub: "정원 · 결제 완료",
      overdue: false,
    });
  });

  it("결제 예정 — 예정일을 보이고, 오늘보다 앞이면 지남", () => {
    const planned = { ...base, paid: false, due_date: "2026-10-10" };
    expect(stayPaymentView(planned, "정원", "2026-10-11")).toMatchObject({
      sub: "정원 · 10/10 결제 예정",
      overdue: true,
    });
    expect(stayPaymentView(planned, "정원", "2026-10-10").overdue).toBe(false);
    expect(stayPaymentView({ ...planned, due_date: null }, "정원", "2026-10-11")).toMatchObject({
      sub: "정원 · 결제 예정",
      overdue: false,
    });
  });

  it("각자 냄 — 결제한 사람 대신 「각자 냄」", () => {
    expect(stayPaymentView({ ...base, split_each: true }, "", "2026-10-11").sub).toBe(
      "각자 냄 · 결제 완료",
    );
  });
});
