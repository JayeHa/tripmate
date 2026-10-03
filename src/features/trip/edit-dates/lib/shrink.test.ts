import { describe, expect, it } from "vitest";

import { shrinkOf } from "./shrink";

const trip = { start: "2026-11-01", end: "2026-11-05" }; // 5일

describe("shrinkOf", () => {
  it("줄어들면 사라지는 날을 알려 준다", () => {
    expect(shrinkOf(trip, { start: "2026-11-10", end: "2026-11-12" })).toEqual({
      lastDay: 3,
      fromDay: 4,
      toDay: 5,
    });
  });

  it("같거나 늘면 null — 날짜만 옮겨도 일정은 그대로 따라간다", () => {
    expect(shrinkOf(trip, { start: "2026-12-01", end: "2026-12-05" })).toBeNull();
    expect(shrinkOf(trip, { start: "2026-11-01", end: "2026-11-07" })).toBeNull();
  });
});
