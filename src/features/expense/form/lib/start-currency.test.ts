import { describe, expect, it } from "vitest";

import { startCurrency } from "./start-currency";

const trip = ["KRW", "JPY", "USD"];

describe("startCurrency", () => {
  it("마지막에 고른 통화가 여행 통화에 있으면 그것", () => {
    expect(startCurrency(trip, "USD", ["JPY", "JPY"])).toBe("USD");
  });

  it("고른 통화가 없거나 여행에서 빠졌으면 가장 많이 쓴 통화", () => {
    expect(startCurrency(trip, null, ["JPY", "USD", "JPY"])).toBe("JPY");
    expect(startCurrency(trip, "EUR", ["USD"])).toBe("USD");
  });

  it("쓴 횟수가 같으면 여행 통화 순서(기준 통화가 먼저)", () => {
    expect(startCurrency(trip, null, ["USD", "JPY"])).toBe("JPY");
    expect(startCurrency(trip, null, ["KRW", "JPY"])).toBe("KRW");
  });

  it("여행에 없는 통화로 쓴 기록은 세지 않는다", () => {
    expect(startCurrency(trip, null, ["EUR", "EUR"])).toBe("JPY");
  });

  it("기록이 없으면 첫 외화, 외화가 없으면 기준 통화", () => {
    expect(startCurrency(trip, null, [])).toBe("JPY");
    expect(startCurrency(["KRW"], null, [])).toBe("KRW");
  });
});
