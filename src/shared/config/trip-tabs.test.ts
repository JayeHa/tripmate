import { describe, expect, it } from "vitest";

import { activeTripTab, TRIP_TABS, tripTabHref } from "./trip-tabs";

const [home, schedule] = TRIP_TABS;

describe("trip-tabs", () => {
  it("일정 탭만 보던 day 를 이어 간다", () => {
    expect(tripTabHref("t", schedule, "2")).toBe("/trips/t/schedule?day=2");
    expect(tripTabHref("t", home, "2")).toBe("/trips/t/home");
    expect(tripTabHref("t", schedule, null)).toBe("/trips/t/schedule");
  });

  it("하위 라우트에서도 부모 탭이 활성", () => {
    expect(activeTripTab("/trips/t/schedule/map", "t")).toBe("schedule");
    expect(activeTripTab("/trips/t/expenses/settlement", "t")).toBe("expenses");
    expect(activeTripTab("/trips/t", "t")).toBeNull();
  });
});
