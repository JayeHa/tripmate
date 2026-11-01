import { describe, expect, it } from "vitest";

import type { TaxRefund } from "@/entities/tax-refund";

import { refundSummary } from "./refund-summary";

/** 테스트용 한 건 */
function refund(over: Partial<TaxRefund>): TaxRefund {
  return {
    id: "r",
    trip_id: "t",
    store: "매장",
    provider: null,
    site_url: null,
    transaction_id: null,
    bought_on: null,
    bought_time: null,
    currency: "JPY",
    amount: null,
    refund_amount: null,
    method: "card",
    method_note: null,
    customs_at: null,
    received_at: null,
    memo: null,
    created_by: null,
    created_at: "1",
    updated_at: "1",
    ...over,
  };
}

describe("refundSummary", () => {
  it("단계별 건수와 받을 돈 · 받은 돈(통화별)", () => {
    expect(
      refundSummary([
        refund({ refund_amount: 1012 }),
        refund({ refund_amount: 1871, customs_at: "x" }),
        refund({ refund_amount: 5, currency: "USD", customs_at: "x", received_at: "y" }),
        refund({}),
      ]),
    ).toEqual({
      counts: { registered: 2, customs: 1, received: 1 },
      expected: "¥2,883",
      received: "$5.00",
    });
    expect(refundSummary([])).toEqual({
      counts: { registered: 0, customs: 0, received: 0 },
      expected: null,
      received: null,
    });
  });
});
