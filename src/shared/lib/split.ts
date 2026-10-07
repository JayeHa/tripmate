/**
 * PC 3분할 [네비게이션 | 화면1 | 화면2] 에서 경계선으로 조절하는 칸의 너비 규칙.
 * 너비를 쥔 칸(`side`)이 범위(min~max) 안에서 움직이고, 반대쪽 칸은 남은 자리를 채우되 `otherMin` 은 남긴다.
 * 화면이 좁으면 최대가 그만큼 줄어든다(최소보다 작아지지는 않는다)
 */
export type SplitConfig = {
  /** 두 칸 바깥의 고정 너비 합 — 네비게이션 레일 · 여백. 화면 너비에서 뺀다 */
  fixed: number;
  min: number;
  max: number;
  /** 처음 너비이자 경계선을 더블클릭 · Enter 했을 때 돌아가는 너비 */
  defaultWidth: number;
  /** 반대쪽 칸이 남겨야 하는 최소 너비 */
  otherMin: number;
  /**
   * 너비를 쥔 칸 — 경계선 왼쪽(first)이면 오른쪽으로 끌 때 넓어지고, 오른쪽(second)이면 좁아진다.
   * 창 크기를 바꾸면 이 칸은 그대로고 반대쪽이 늘고 준다
   */
  side: "first" | "second";
};

/** 이 화면 너비에서 쥔 칸이 가질 수 있는 최대 너비 */
export function splitMaxWidth(config: SplitConfig, viewportWidth: number): number {
  return Math.max(config.min, Math.min(config.max, viewportWidth - config.fixed - config.otherMin));
}

/** 너비를 허용 범위로 자른다(정수 px) */
export function clampSplitWidth(config: SplitConfig, width: number, viewportWidth: number): number {
  return Math.max(config.min, Math.min(splitMaxWidth(config, viewportWidth), Math.round(width)));
}

/** 경계선을 dx 만큼 끌었을 때의 너비 — 오른쪽 칸이 쥐고 있으면 오른쪽으로 끌수록 좁아진다 */
export function draggedWidth(config: SplitConfig, startWidth: number, dx: number): number {
  return config.side === "first" ? startWidth + dx : startWidth - dx;
}
