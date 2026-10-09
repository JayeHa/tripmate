import { describe, expect, it } from "vitest";

import { newPeriod } from "./new-period";

const START = "2026-10-31";
const END = "2026-11-04";

describe("newPeriod", () => {
  it("날짜 줄이 보이면 줄에서 고른 날", () => {
    expect(newPeriod("2", true, START, END, "2026-11-01")).toBe("2");
  });

  it("맨 위에서는 오늘 — 여행 전 여행준비, 여행 중 그날, 끝났으면 null", () => {
    expect(newPeriod("prep", false, START, END, "2026-10-09")).toBe("prep");
    expect(newPeriod("prep", false, START, END, "2026-11-01")).toBe("1");
    expect(newPeriod("prep", false, START, END, "2026-11-10")).toBeNull();
  });
});
