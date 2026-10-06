import { describe, expect, it } from "vitest";

import { periodLabel, periodParam } from "./period";

describe("periodLabel · periodParam", () => {
  it("여행준비와 day N", () => {
    expect(periodLabel("prep", "2026-10-31")).toEqual({ label: "여행준비", date: "" });
    expect(periodLabel(1, "2026-10-31")).toEqual({ label: "day 2", date: "11.1/일" });
    expect(periodParam("prep")).toBe("prep");
    expect(periodParam(2)).toBe("2");
  });
});
