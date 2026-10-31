import { describe, expect, it } from "vitest";

import { autoTime, nowTime } from "./spent-time";

describe("autoTime", () => {
  const base = { spentOn: "2026-11-01", itemTime: null, today: "2026-11-01", now: "14:20" };

  it("연결한 일정에 시간이 있으면 그 시간 — 오늘이어도", () => {
    expect(autoTime({ ...base, itemTime: "10:50:00" })).toBe("10:50");
  });

  it("연결이 없거나 시간 없는 일정이면 오늘은 지금 시각, 다른 날은 빈 칸", () => {
    expect(autoTime(base)).toBe("14:20");
    expect(autoTime({ ...base, spentOn: "2026-10-31" })).toBe("");
  });

  it("여행준비면 늘 빈 칸", () => {
    expect(autoTime({ ...base, spentOn: "", itemTime: "10:50" })).toBe("");
  });
});

describe("nowTime", () => {
  it("두 자리로 채운다", () => {
    expect(nowTime(new Date(2026, 10, 1, 9, 5))).toBe("09:05");
  });
});
