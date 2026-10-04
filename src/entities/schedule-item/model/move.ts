import type { Tables } from "@/shared/api/supabase/database.types";

/** 장소 두 곳 사이의 이동 방법. 이동은 일정 한 줄이 아니라 쌍에 붙는 기록이다 */
export type Move = Tables<"moves">;

export const MOVE_MODES = ["subway", "bus", "train", "taxi", "walk", "flight"] as const;
export type MoveMode = (typeof MOVE_MODES)[number];

/** 수단 칩과 타임라인 표시에 쓰는 이모지 + 이름 */
export const MOVE_MODE_LABEL = {
  subway: "🚇 지하철",
  bus: "🚌 버스",
  train: "🚆 기차",
  taxi: "🚕 택시",
  walk: "🚶 도보",
  flight: "✈️ 항공",
} satisfies Record<MoveMode, string>;

export const MOVE_DETAIL_MAX = 60;

/** 이동 수단. 없거나 모르는 값이면 null */
export function moveModeOf(move: Pick<Move, "mode">): MoveMode | null {
  return MOVE_MODES.find((m) => m === move.mode) ?? null;
}

/** 쌍을 찾는 키. 같은 두 장소 사이에는 기록이 하나뿐이다(DB unique) */
export function moveKey(fromItemId: string, toItemId: string): string {
  return `${fromItemId}>${toItemId}`;
}
