/**
 * PC 일정 3단 [날짜 레일 | 일정 목록 | 지도] 의 목록 너비.
 * 목록은 360~728px, 지도는 최소 320px 을 남긴다. 화면이 좁으면 최대가 그만큼 줄어든다.
 */
export const RAIL_WIDTH = 232;
export const MAP_MIN_WIDTH = 320;
export const LIST_MIN_WIDTH = 360;
export const LIST_MAX_WIDTH = 728;
/** 처음 너비이자 경계선을 더블클릭했을 때 돌아가는 너비 */
export const LIST_DEFAULT_WIDTH = 440;

/** 이 화면 너비에서 목록이 가질 수 있는 최대 너비 */
export function listMaxWidth(viewportWidth: number): number {
  return Math.max(
    LIST_MIN_WIDTH,
    Math.min(LIST_MAX_WIDTH, viewportWidth - RAIL_WIDTH - MAP_MIN_WIDTH),
  );
}

/** 목록 너비를 허용 범위로 자른다(정수 px) */
export function clampListWidth(width: number, viewportWidth: number): number {
  return Math.max(LIST_MIN_WIDTH, Math.min(listMaxWidth(viewportWidth), Math.round(width)));
}

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
    { key: "list", label: "일정 크게", width: listMaxWidth(viewportWidth) },
    { key: "half", label: "반반", width: clampListWidth(524, viewportWidth) },
    { key: "map", label: "지도 크게", width: LIST_MIN_WIDTH },
  ];
}
