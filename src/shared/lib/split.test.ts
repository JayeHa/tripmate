import { describe, expect, it } from "vitest";

import { clampSplitWidth, draggedWidth, type SplitConfig, splitMaxWidth } from "./split";

const first: SplitConfig = {
  fixed: 232,
  min: 360,
  max: 728,
  defaultWidth: 440,
  otherMin: 320,
  side: "first",
};
const second: SplitConfig = { ...first, side: "second" };

describe("PC 3분할 너비", () => {
  it("넓은 화면은 max, 좁은 화면은 반대쪽 최소를 남기도록 줄어든다", () => {
    expect(splitMaxWidth(first, 1280)).toBe(728);
    expect(splitMaxWidth(first, 1100)).toBe(1100 - 232 - 320);
  });

  it("아주 좁아도 최소보다 작아지지 않는다", () => {
    expect(splitMaxWidth(first, 800)).toBe(360);
  });

  it("범위 밖은 잘리고 소수는 반올림", () => {
    expect(clampSplitWidth(first, 200, 1280)).toBe(360);
    expect(clampSplitWidth(first, 900, 1280)).toBe(728);
    expect(clampSplitWidth(first, 500.6, 1280)).toBe(501);
  });

  it("끄는 방향 — 왼쪽 칸은 오른쪽으로 끌면 넓어지고, 오른쪽 칸은 좁아진다", () => {
    expect(draggedWidth(first, 400, 30)).toBe(430);
    expect(draggedWidth(second, 400, 30)).toBe(370);
  });
});
