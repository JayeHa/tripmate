import { describe, expect, it } from "vitest";

import { heroCopy, nextCollapsed } from "./hero";

describe("heroCopy", () => {
  const start = "2026-10-31";
  const end = "2026-11-04";

  it("출발 전에는 남은 날을 센다", () => {
    expect(heroCopy(start, end, "2026-10-03")).toEqual({
      headline: "두근두근, 여행 D-28",
      short: "여행 D-28",
    });
  });

  it("출발일은 D-DAY", () => {
    expect(heroCopy(start, end, start).headline).toBe("두근두근, 여행 D-DAY");
  });

  it("여행 중에는 몇째 날인지", () => {
    expect(heroCopy(start, end, "2026-11-01")).toEqual({
      headline: "즐거운 여행 중, day 2",
      short: "여행 day 2",
    });
    expect(heroCopy(start, end, end).short).toBe("여행 day 5");
  });

  it("끝난 뒤", () => {
    expect(heroCopy(start, end, "2026-11-05")).toEqual({
      headline: "즐거웠던 여행",
      short: "지난 여행",
    });
  });
});

describe("nextCollapsed", () => {
  it("펼친 상태는 80 을 넘어야 접힌다", () => {
    expect(nextCollapsed(false, 80)).toBe(false);
    expect(nextCollapsed(false, 81)).toBe(true);
  });

  it("접힌 상태는 24 이하로 와야 펴진다", () => {
    expect(nextCollapsed(true, 50)).toBe(true);
    expect(nextCollapsed(true, 24)).toBe(false);
  });
});
