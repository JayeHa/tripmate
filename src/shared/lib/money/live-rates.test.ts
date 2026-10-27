import { describe, expect, it } from "vitest";

import { liveUnitValue, parseLiveRates } from "./live-rates";

const RESPONSE = {
  result: "success",
  base_code: "KRW",
  time_last_update_unix: 1_793_059_200,
  rates: { KRW: 1, JPY: 0.1104, USD: 0.00072, XYZ: 3, BAD: "x" },
};

describe("parseLiveRates", () => {
  it("성공 응답을 우리 모양으로 — 아는 통화 · 숫자만", () => {
    expect(parseLiveRates(RESPONSE, "KRW", ["KRW", "JPY", "USD", "BAD"])).toEqual({
      base: "KRW",
      updatedAt: "2026-10-27T00:00:00.000Z",
      rates: { KRW: 1, JPY: 0.1104, USD: 0.00072 },
    });
  });

  it("실패 · 다른 기준 통화 · 모양이 다르면 null", () => {
    expect(parseLiveRates({ result: "error" }, "KRW", ["JPY"])).toBeNull();
    expect(parseLiveRates({ ...RESPONSE, base_code: "USD" }, "KRW", ["JPY"])).toBeNull();
    expect(parseLiveRates(null, "KRW", ["JPY"])).toBeNull();
    expect(parseLiveRates({ ...RESPONSE, rates: null }, "KRW", ["JPY"])).toBeNull();
  });
});

describe("liveUnitValue", () => {
  const live = { base: "KRW", updatedAt: "", rates: { JPY: 0.1104 } };

  it("그 통화 unit 단위의 기준 통화 금액", () => {
    expect(liveUnitValue(live, "JPY", 100)).toBeCloseTo(905.8, 1);
    expect(liveUnitValue(live, "USD", 1)).toBeNull();
  });
});
