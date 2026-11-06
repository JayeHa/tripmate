import type { CSSProperties } from "react";

import { cn } from "@/shared/lib/utils";

import type { RouteLine } from "../../lib/route";

/** 선 모양 → 세로 선의 스타일. 실선은 채운 막대, 점선 · 파선은 왼쪽 테두리 */
function lineStyle(line: RouteLine): CSSProperties {
  if (line.style === "solid") return { width: line.width, background: line.color };
  return { width: 0, borderLeft: `${line.width}px ${line.style} ${line.color}` };
}

type RouteLineBarProps = {
  line: RouteLine | null;
  /** 선 칸 안의 위치 — 「top-0 h-7.5」 처럼 세로 범위만 준다(가로는 가운데) */
  className?: string;
};

/** 노선도 선 칸(40) 가운데의 세로 선 한 토막. 선이 없으면 그리지 않는다 */
export function RouteLineBar({ line, className }: RouteLineBarProps) {
  if (!line) return null;
  return (
    <span
      aria-hidden="true"
      style={lineStyle(line)}
      className={cn("absolute left-1/2 -translate-x-1/2", className)}
    />
  );
}
