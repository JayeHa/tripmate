import { describe, expect, it } from "vitest";

import { clampListWidth, listMaxWidth, splitPresets } from "./split";

describe("PC 3단 목록 너비", () => {
  it("1280 화면: 최대 728(레일 232 + 지도 320 을 남겨도 728 이 먼저)", () => {
    expect(listMaxWidth(1280)).toBe(728);
  });

  it("좁은 화면(1100)은 지도 320 을 남기도록 최대가 줄어든다", () => {
    expect(listMaxWidth(1100)).toBe(1100 - 232 - 320);
  });

  it("범위 밖은 잘리고 소수는 반올림", () => {
    expect(clampListWidth(200, 1280)).toBe(360);
    expect(clampListWidth(900, 1280)).toBe(728);
    expect(clampListWidth(500.6, 1280)).toBe(501);
  });

  it("프리셋: 일정 크게 = 최대, 반반 = 524, 지도 크게 = 360", () => {
    expect(splitPresets(1280).map((p) => [p.key, p.width])).toEqual([
      ["list", 728],
      ["half", 524],
      ["map", 360],
    ]);
  });
});
