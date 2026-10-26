import { describe, expect, it } from "vitest";

import { ddayChipLabel, homeRangeLabel, nextCollapsed } from "./home-header";

describe("ddayChipLabel", () => {
  const start = "2026-10-31";
  const end = "2026-11-04";

  it("출발 전에는 남은 날을 센다", () => {
    expect(ddayChipLabel(start, end, "2026-10-03")).toBe("D-28");
    expect(ddayChipLabel(start, end, "2026-10-30")).toBe("D-1");
  });

  it("출발일부터 마지막 날까지는 몇째 날인지", () => {
    expect(ddayChipLabel(start, end, start)).toBe("여행 1일째");
    expect(ddayChipLabel(start, end, "2026-11-01")).toBe("여행 2일째");
    expect(ddayChipLabel(start, end, end)).toBe("여행 5일째");
  });

  it("끝난 뒤", () => {
    expect(ddayChipLabel(start, end, "2026-11-05")).toBe("여행 끝");
  });
});

describe("homeRangeLabel", () => {
  it("기간 뒤에 박 · 일을 붙인다", () => {
    expect(homeRangeLabel("2026-10-31", "2026-11-04")).toBe("2026.10.31 - 11.4 · 4박 5일");
  });

  it("당일 여행은 0박 1일", () => {
    expect(homeRangeLabel("2026-10-31", "2026-10-31")).toBe("2026.10.31 - 10.31 · 0박 1일");
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
