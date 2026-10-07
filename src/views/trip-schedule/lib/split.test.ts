import { describe, expect, it } from "vitest";

import { activePreset, splitPresets } from "./split";

describe("PC 일정 목록 너비 프리셋", () => {
  it("좁은 창(1050)에서 일정 크게 = 반반이면 앞의 하나만 켠다", () => {
    const presets = splitPresets(1050);
    expect(presets[0].width).toBe(presets[1].width);
    expect(activePreset(presets, presets[0].width)).toBe("list");
    expect(activePreset(presets, 440)).toBeNull();
  });

  it("프리셋: 일정 크게 = 최대, 반반 = 524, 지도 크게 = 360", () => {
    expect(splitPresets(1280).map((p) => [p.key, p.width])).toEqual([
      ["list", 728],
      ["half", 524],
      ["map", 360],
    ]);
  });

  it("좁은 화면(1100)의 일정 크게는 지도 320 을 남긴다", () => {
    expect(splitPresets(1100)[0].width).toBe(1100 - 232 - 320);
  });
});
