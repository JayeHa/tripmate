import { describe, expect, it } from "vitest";

import { countVisit, dismissNudge, parseNudge, shouldNudge } from "./nudge-rules";

const DAY = 24 * 60 * 60 * 1000;
const now = Date.UTC(2026, 9, 30);

describe("parseNudge", () => {
  it("없거나 깨진 값은 처음 상태", () => {
    expect(parseNudge(null)).toEqual({ visits: 0, dismissed: 0, until: 0 });
    expect(parseNudge("{")).toEqual({ visits: 0, dismissed: 0, until: 0 });
    expect(parseNudge('{"visits":"3","dismissed":-1}')).toEqual({
      visits: 0,
      dismissed: 0,
      until: 0,
    });
  });

  it("저장한 값을 그대로 읽는다", () => {
    expect(parseNudge('{"visits":2,"dismissed":1,"until":5}')).toEqual({
      visits: 2,
      dismissed: 1,
      until: 5,
    });
  });
});

describe("shouldNudge", () => {
  const first = countVisit(parseNudge(null));
  const second = countVisit(first);

  it("첫 방문은 둘러보게 두고 두 번째 방문부터", () => {
    expect(shouldNudge(first, { now, inApp: false })).toBe(false);
    expect(shouldNudge(second, { now, inApp: false })).toBe(true);
  });

  it("앱 안 브라우저는 첫 방문에도", () => {
    expect(shouldNudge(first, { now, inApp: true })).toBe(true);
  });

  it("닫으면 14일 쉬고, 세 번 닫으면 그만", () => {
    const once = dismissNudge(second, now);
    expect(shouldNudge(once, { now: now + 13 * DAY, inApp: false })).toBe(false);
    expect(shouldNudge(once, { now: now + 14 * DAY, inApp: false })).toBe(true);
    const thrice = dismissNudge(dismissNudge(once, now), now);
    expect(shouldNudge(thrice, { now: now + 100 * DAY, inApp: false })).toBe(false);
  });
});
