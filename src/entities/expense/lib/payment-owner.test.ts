import { describe, expect, it } from "vitest";

import { ownerColumns, paymentOwnerOf } from "./payment-owner";

describe("결제 주인", () => {
  it("숙소 · 항공편 · 둘 다 아님", () => {
    expect(paymentOwnerOf({ stay_id: "s", flight_id: null })).toBe("stay");
    expect(paymentOwnerOf({ stay_id: null, flight_id: "f" })).toBe("flight");
    expect(paymentOwnerOf({ stay_id: null, flight_id: null })).toBeNull();
  });

  it("넣을 행의 칸 — 한쪽만 채운다", () => {
    expect(ownerColumns({ kind: "flight", id: "f" })).toEqual({ stay_id: null, flight_id: "f" });
    expect(ownerColumns({ kind: "stay", id: "s" })).toEqual({ stay_id: "s", flight_id: null });
    expect(ownerColumns(null)).toEqual({ stay_id: null, flight_id: null });
  });
});
