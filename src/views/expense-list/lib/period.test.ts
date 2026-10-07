import { describe, expect, it } from "vitest";

import { periodLabel, periodParam, sortedCurrencies } from "./period";

describe("periodLabel · periodParam", () => {
  it("여행준비와 day N", () => {
    expect(periodLabel("prep", "2026-10-31")).toEqual({ label: "여행준비", date: "" });
    expect(periodLabel(1, "2026-10-31")).toEqual({ label: "day 2", date: "11.1/일" });
    expect(periodParam("prep")).toBe("prep");
    expect(periodParam(2)).toBe("2");
  });
});

describe("sortedCurrencies", () => {
  it("기준 화폐를 맨 앞에", () => {
    expect(sortedCurrencies({ JPY: 3000, KRW: 5000, USD: 10 }, "KRW")).toEqual([
      ["KRW", 5000],
      ["JPY", 3000],
      ["USD", 10],
    ]);
  });
});
