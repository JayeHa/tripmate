import { describe, expect, it } from "vitest";

import type { TaxRefund } from "@/entities/tax-refund";

import { departureRefunds, departureStep } from "./departure-refunds";

/** 테스트용 한 건 */
function refund(id: string, over: Partial<TaxRefund>): TaxRefund {
  return {
    id,
    trip_id: "t",
    store: id,
    provider: null,
    site_url: null,
    transaction_id: null,
    bought_on: "2026-11-01",
    bought_time: null,
    currency: "JPY",
    amount: null,
    refund_amount: null,
    method: "card",
    method_note: null,
    customs_at: null,
    received_at: null,
    memo: null,
    owner_id: null,
    barcode: null,
    created_by: null,
    created_at: "1",
    updated_at: "1",
    ...over,
  };
}

describe("출국 날 환급", () => {
  it("할 일 — 신청만 했으면 세관 확인, 세관 확인한 현금은 받기, 카드는 세관 확인 뒤 없음", () => {
    expect(departureStep(refund("a", {}))).toBe("customs");
    expect(departureStep(refund("b", { method: "cash", customs_at: "x" }))).toBe("received");
    expect(departureStep(refund("c", { customs_at: "x" }))).toBeNull();
    expect(
      departureStep(refund("d", { method: "cash", customs_at: "x", received_at: "y" })),
    ).toBeNull();
  });

  it("마지막 날에만, 세관 확인 전 먼저 · 구매 순, 할 일이 없으면 null", () => {
    const list = [
      refund("cash", { method: "cash", customs_at: "x" }),
      refund("late", { bought_time: "20:03:00" }),
      refund("early", { bought_time: "17:01:00", method: "cash" }),
      refund("done", { customs_at: "x" }),
    ];
    expect(departureRefunds(list, false)).toBeNull();
    const view = departureRefunds(list, true);
    expect(view?.rows.map((r) => [r.refund.id, r.step])).toEqual([
      ["early", "customs"],
      ["late", "customs"],
      ["cash", "received"],
    ]);
    expect(view?.customsLeft).toBe(2);
    expect(view?.hasCash).toBe(true);
    expect(departureRefunds([refund("done", { customs_at: "x" })], true)).toBeNull();
  });
});
