import { describe, expect, it } from "vitest";

import type { TaxRefund } from "../model/types";
import {
  boughtLabel,
  refundCounts,
  refundGroups,
  refundStatus,
  refundSums,
  startRefundCurrency,
  stepPatch,
} from "./refund";

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

describe("택스 리펀 계산", () => {
  it("단계 — 받은 시각 → 세관 확인 시각 → 신청함", () => {
    expect(refundStatus({ customs_at: null, received_at: null })).toBe("registered");
    expect(refundStatus({ customs_at: "x", received_at: null })).toBe("customs");
    expect(refundStatus({ customs_at: "x", received_at: "y" })).toBe("received");
  });

  it("묶음은 세관 확인 전 → 받을 것 → 받았어요, 안은 구매 순(날짜 없는 건은 뒤)", () => {
    const a = refund({ id: "a", bought_on: "2026-11-01", bought_time: "20:03:00" });
    const b = refund({ id: "b", bought_on: "2026-11-01", bought_time: "17:01:00" });
    const c = refund({ id: "c", created_at: "0" });
    const d = refund({ id: "d", customs_at: "x", received_at: "y" });
    expect(refundGroups([a, c, d, b]).map((g) => [g.status, g.items.map((r) => r.id)])).toEqual([
      ["registered", ["b", "a", "c"]],
      ["received", ["d"]],
    ]);
    expect(refundCounts([a, b, c, d])).toEqual({ registered: 3, customs: 0, received: 1 });
  });

  it("환급 예정액 합계는 통화마다, 금액 없는 건은 뺀다", () => {
    expect(
      refundSums([
        refund({ refund_amount: 1012 }),
        refund({ refund_amount: 1871 }),
        refund({ refund_amount: 3, currency: "USD" }),
        refund({}),
      ]),
    ).toEqual([
      { currency: "JPY", amount: 2883 },
      { currency: "USD", amount: 3 },
    ]);
  });

  it("구매 표시 — 날짜 · 시각, 시각은 초를 뗀다, 날짜 없으면 null", () => {
    expect(boughtLabel({ bought_on: "2026-11-01", bought_time: "17:01:00" })).toBe(
      "11.1 (일) 17:01",
    );
    expect(boughtLabel({ bought_on: "2026-11-01", bought_time: null })).toBe("11.1 (일)");
    expect(boughtLabel({ bought_on: null, bought_time: null })).toBeNull();
  });

  it("새 건 통화 — 마지막에 고친 건 → 첫 외화 → 기준 통화", () => {
    const currencies = ["KRW", "JPY", "USD"];
    expect(
      startRefundCurrency(currencies, [
        refund({ currency: "USD", updated_at: "2" }),
        refund({ currency: "JPY", updated_at: "1" }),
      ]),
    ).toBe("USD");
    expect(startRefundCurrency(currencies, [refund({ currency: "EUR" })])).toBe("JPY");
    expect(startRefundCurrency(["KRW"], [])).toBe("KRW");
  });

  it("단계 바꾸기 — 받았어요는 세관 확인도 채우고, 세관 확인 되돌리기는 둘 다 비운다", () => {
    const none = { customs_at: null, received_at: null };
    expect(stepPatch(none, "customs", "now")).toEqual({ customs_at: "now", received_at: null });
    expect(stepPatch(none, "received", "now")).toEqual({ customs_at: "now", received_at: "now" });
    expect(stepPatch({ customs_at: "a", received_at: null }, "received", "now")).toEqual({
      customs_at: "a",
      received_at: "now",
    });
    expect(stepPatch({ customs_at: "a", received_at: "b" }, "customs", "now")).toEqual({
      customs_at: "a",
      received_at: null,
    });
    expect(stepPatch({ customs_at: "a", received_at: "b" }, "registered", "now")).toEqual(none);
  });
});
