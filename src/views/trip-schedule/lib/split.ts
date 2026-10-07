import { clampSplitWidth, type SplitConfig, splitMaxWidth } from "@/shared/lib/split";

/**
 * PC 일정 3단 [날짜 레일 232 | 일정 목록 | 지도] — 목록 너비를 쥔다.
 * 목록은 360~728px(처음 440), 지도는 최소 320px 을 남긴다. 화면이 좁으면 최대가 그만큼 줄어든다
 */
export const SCHEDULE_SPLIT: SplitConfig = {
  fixed: 232,
  min: 360,
  max: 728,
  defaultWidth: 440,
  otherMin: 320,
  side: "first",
};

export type SplitPreset = { key: "list" | "half" | "map"; label: string; width: number };

/**
 * 지금 너비에 맞는 프리셋 하나. 좁은 창에서는 「일정 크게」 와 「반반」 이 같은 너비가 되는데,
 * 둘 다 켜지지 않게 앞의 것 하나만 고른다.
 */
export function activePreset(presets: SplitPreset[], width: number): SplitPreset["key"] | null {
  return presets.find((p) => Math.abs(width - p.width) < 4)?.key ?? null;
}

/** 지도 위 프리셋 「일정 크게 · 반반 · 지도 크게」 */
export function splitPresets(viewportWidth: number): SplitPreset[] {
  return [
    { key: "list", label: "일정 크게", width: splitMaxWidth(SCHEDULE_SPLIT, viewportWidth) },
    { key: "half", label: "반반", width: clampSplitWidth(SCHEDULE_SPLIT, 524, viewportWidth) },
    { key: "map", label: "지도 크게", width: SCHEDULE_SPLIT.min },
  ];
}
