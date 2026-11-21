import type { RouteSegment } from "./route";

/** 「1시간 15분」 · 「25분」 */
export function durationText(minutes: number): string {
  if (minutes < 60) return `${minutes}분`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}시간 ${m}분` : `${h}시간`;
}

/** 동선 지도 카드의 들어오는 이동 「🚌 1시간 15분」 · 추정이면 「🚇 약 15분」. 글자 없는 구간(좌표 없음 · 같은 자리)은 null */
export function segmentChip(seg: RouteSegment): string | null {
  if (seg.mode === "none" || seg.minutes === null) return null;
  return `${seg.icon} ${seg.estimated ? "약 " : ""}${durationText(seg.minutes)}`;
}

/** 짧은 도보는 출발 시각을 적지 않는다(이 분 이하) */
const SHORT_WALK = 10;

/** 노선도 구간 글자의 진한 앞부분 「버스 1시간 15분」 · 추정이면 「대중교통 약 15분」. 글자 없는 구간(좌표 없음 · 같은 자리)은 null */
export function segmentLabel(seg: RouteSegment): string | null {
  if (seg.mode === "none" || seg.minutes === null) return null;
  return `${seg.modeName} ${seg.estimated ? "약 " : ""}${durationText(seg.minutes)}`;
}

/** 구간 글자의 옅은 뒷부분 「10:55 출발 · TYO-NRT 긴자행」. 10분 이하 도보는 출발 시각을 빼고, 글자 없는 구간은 "" */
export function segmentMeta(seg: RouteSegment): string {
  if (segmentLabel(seg) === null) return "";
  const shortWalk = seg.mode === "walk" && (seg.minutes ?? 0) <= SHORT_WALK;
  return [!shortWalk && seg.depTime && `${seg.depTime} 출발`, seg.detail]
    .filter(Boolean)
    .join(" · ");
}
