import { describe, expect, it } from "vitest";

import { closedSeen, currentTip, type TipSeen } from "./coach";

const NONE: TipSeen = { mode: false, map: false, visit: false };

describe("currentTip", () => {
  it("모바일은 계획 | 기록 → 동선 보기 → 다녀왔어요 순서", () => {
    expect(currentTip(NONE, true)).toBe("mode");
    expect(currentTip({ ...NONE, mode: true }, true)).toBe("map");
    expect(currentTip({ ...NONE, mode: true, map: true }, true)).toBe("visit");
  });

  it("PC 는 동선 보기를 건너뛴다", () => {
    expect(currentTip({ ...NONE, mode: true }, false)).toBe("visit");
  });

  it("다 봤으면 null", () => {
    expect(currentTip({ mode: true, map: true, visit: true }, true)).toBeNull();
    expect(currentTip({ mode: true, map: false, visit: true }, false)).toBeNull();
  });
});

describe("closedSeen", () => {
  it("모바일의 계획 | 기록에서 닫으면 동선 보기도 본 것으로", () => {
    expect(closedSeen(NONE, "mode", true)).toEqual({ mode: true, map: true, visit: false });
  });

  it("PC 는 계획 | 기록만", () => {
    expect(closedSeen(NONE, "mode", false)).toEqual({ mode: true, map: false, visit: false });
  });

  it("그 밖의 말풍선은 그것만", () => {
    const seen = { ...NONE, mode: true };
    expect(closedSeen(seen, "map", true)).toEqual({ mode: true, map: true, visit: false });
    expect(closedSeen(seen, "visit", false)).toEqual({ mode: true, map: false, visit: true });
  });
});
