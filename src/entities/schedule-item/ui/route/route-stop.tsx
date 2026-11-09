import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

import type { RouteLine } from "../../lib/route";
import type { StopKind } from "../../lib/route-day";
import { RouteLineBar } from "./route-line";
import { StopMarker, type StopTone } from "./stop-marker";

/** 역 행 바탕 — 고른(펼친) 역. 기록 모드는 초록 기운 */
const SELECTED_BG: Record<StopTone, string> = {
  plan: "bg-route-row-open",
  done: "bg-visited-row",
  current: "bg-visited-row",
  todo: "bg-visited-row",
};

type RouteStopProps = {
  /** 「HH:mm」. 없으면 빈 칸 */
  time: string | null;
  name: string;
  /** 이름 옆 칩(예약 상태 · 「지금 여기」) */
  badge?: ReactNode;
  /** 둘째 줄 「관광 · 설명 · 메모 2」 */
  sub?: ReactNode;
  kind: StopKind;
  tone: StopTone;
  /** 들어오는 구간의 선(마커 위 반쪽). 첫 역은 null */
  inLine: RouteLine | null;
  /** 나가는 구간의 선(마커 아래 반쪽 + 펼침 칸). 마지막 역은 null */
  outLine: RouteLine | null;
  /** 펼쳤거나 고른 역 — 바탕 · 마커 링 */
  selected?: boolean;
  /** PC — 1줄 오른쪽 끝 「📍5」(지도 핀 번호) */
  pinNo?: number | null;
  onClick?: () => void;
  /** 누르면 아래 칸을 펼친다 — 접혀서 칸이 없을 때도 화면 읽기에 「접힘」 을 알린다 */
  expandable?: boolean;
  /** PC — 행에 올리면 그 핀을 키운다 */
  onHover?: (hovering: boolean) => void;
  /** 역 아래 칸(메모 · 버튼 · 노트 · 기록). 선은 이 칸을 지나 이어진다 */
  children?: ReactNode;
};

/**
 * 노선도의 역(장소) 한 줄 — 3열 격자 「시각 48 | 선 40 | 내용」. 마커는 선 칸 가운데(행 위에서 30)에 있고,
 * 들어오는 구간 선은 마커 위, 나가는 구간 선은 마커 아래부터 펼침 칸 끝까지 이어진다.
 * 남은 역(기록 모드)은 행 전체를 흐리게 한다
 */
export function RouteStop({
  time,
  name,
  badge,
  sub,
  kind,
  tone,
  inLine,
  outLine,
  selected = false,
  pinNo = null,
  onClick,
  expandable = false,
  onHover,
  children,
}: RouteStopProps) {
  return (
    <div
      className={cn(
        "rounded-card transition-colors duration-150",
        selected ? SELECTED_BG[tone] : onHover && "hover:bg-route-row-hover",
        tone === "todo" && "opacity-45",
      )}
      onPointerEnter={onHover && (() => onHover(true))}
      onPointerLeave={onHover && (() => onHover(false))}
    >
      <button
        type="button"
        onClick={onClick}
        aria-expanded={expandable ? selected : undefined}
        className="grid min-h-15 w-full grid-cols-[48px_40px_1fr] text-left"
      >
        <span className="pt-5 pr-1 text-right text-[13px]/5 font-extrabold text-ink-900 tabular-nums">
          {time}
        </span>
        <span className="relative">
          <RouteLineBar line={inLine} className="top-0 h-7.5" />
          <RouteLineBar line={outLine} className="top-7.5 bottom-0" />
          <StopMarker
            kind={kind}
            tone={tone}
            selected={selected}
            className="absolute top-7.5 left-1/2 -translate-1/2"
          />
        </span>
        <span className="flex min-w-0 flex-col justify-center gap-0.75 py-2 pr-2 pl-1.5">
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-[15px] font-extrabold text-ink-900">{name}</span>
            {badge}
            {pinNo !== null && (
              <span
                className={cn(
                  "ml-auto shrink-0 text-[11px] font-extrabold",
                  selected ? "text-route-stop" : "text-route-meta-dim",
                )}
              >
                📍{pinNo}
              </span>
            )}
          </span>
          {sub && <span className="truncate text-xs text-route-sub">{sub}</span>}
        </span>
      </button>
      {children && (
        <div className="grid grid-cols-[48px_40px_1fr]">
          <span />
          <span className="relative">
            <RouteLineBar line={outLine} className="inset-y-0" />
          </span>
          <div className="flex min-w-0 flex-col gap-2 pr-2 pb-2.5 pl-1.5">{children}</div>
        </div>
      )}
    </div>
  );
}
