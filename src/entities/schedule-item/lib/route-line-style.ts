import type { RouteMode, RouteTone } from "./route";

/** 선 하나의 모양 — 목록(세로 선)과 지도(폴리라인)가 같이 쓴다. 색은 지도에도 넘기므로 hex */
export type RouteLine = { width: number; style: "solid" | "dotted" | "dashed"; color: string };

/** 수단별 선 — 목록 · 지도의 굵기와 계획 모드 색 */
const LINE: Record<
  RouteMode,
  { style: RouteLine["style"]; list: number; map: number; color: string; mapColor: string }
> = {
  transit: { style: "solid", list: 3, map: 4, color: "#3A8BFF", mapColor: "#3A8BFF" },
  walk: { style: "dotted", list: 2, map: 3, color: "#A0A7B1", mapColor: "#7D8590" },
  flight: { style: "dashed", list: 2, map: 3, color: "#222222", mapColor: "#222222" },
  none: { style: "solid", list: 2, map: 2, color: "#E3E5E8", mapColor: "#E3E5E8" },
};

/** 기록 모드의 지나온 구간(초록) · 남은 구간(실선은 연회색, 점선 · 파선은 그보다 조금 진하게) */
const DONE_COLOR = "#10B981";
const TODO_SOLID = "#DDE1E6";
const TODO_BROKEN = "#D7DCE2";
/** 지도의 남은 구간 */
const TODO_MAP = "#C9CDD2";

/** 남은 구간 색 — 좌표 없는 구간은 늘 같은 회색, 지도는 한 색, 목록은 실선이 더 연하다 */
function todoColor(mode: RouteMode, onMap: boolean): string {
  if (mode === "none") return LINE.none.color;
  if (onMap) return TODO_MAP;
  return LINE[mode].style === "solid" ? TODO_SOLID : TODO_BROKEN;
}

/**
 * 구간 선의 모양. 선 종류(실선 · 점선 · 파선)와 굵기는 수단이 정하고, 색은 tone 이 정한다 —
 * 계획은 수단 색, 지나온 구간은 초록, 남은 구간은 연회색. onMap 이면 지도 굵기 · 색(도보는 지도 위에서 더 진하게)
 */
export function routeLineStyle(
  mode: RouteMode,
  tone: RouteTone,
  { onMap = false }: { onMap?: boolean } = {},
): RouteLine {
  const line = LINE[mode];
  const width = onMap ? line.map : line.list;
  if (tone === "done") return { width, style: line.style, color: DONE_COLOR };
  if (tone === "todo") return { width, style: line.style, color: todoColor(mode, onMap) };
  return { width, style: line.style, color: onMap ? line.mapColor : line.color };
}

/** 패스한 역에 닿는 구간 — 수단과 상관없이 2px 회색 파선(목록 · 지도 같다) */
export const PASS_LINE: RouteLine = { width: 2, style: "dashed", color: "#9CA3AF" };
