import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

import type { RouteLine } from "../../lib/route";
import type { StopKind } from "../../lib/route-day";
import type { PlaceCategory } from "../../model/place";
import { RouteLineBar } from "./route-line";
import { StopMarker, type StopTone } from "./stop-marker";

/** 카드 테두리 — 지금 여기(초록) · 고른 카드(계획 파랑 · 기록 초록) · 올림(PC) · 보통 */
function cardClass(tone: StopTone, selected: boolean, hovered: boolean): string {
  if (tone === "current") {
    return "border-[1.5px] border-visited shadow-[0_0_0_4px_rgba(16,185,129,.12)]";
  }
  if (selected && tone === "plan") {
    return "border-route-card-open shadow-[0_0_0_3px_rgba(58,139,255,.12)]";
  }
  if (selected) return "border-visited-line shadow-[0_0_0_3px_rgba(16,185,129,.1)]";
  if (hovered) return "border-route-card-hover shadow-[0_2px_8px_rgba(0,0,0,.07)]";
  return "border-route-card-line shadow-[0_1px_4px_rgba(0,0,0,.05)]";
}

type RouteStopProps = {
  /** 「HH:mm」. 없으면 빈 칸 */
  time: string | null;
  name: string;
  /** 이름 앞 이모지. 없으면 두지 않는다 */
  emoji?: string | null;
  /** 첫 줄 오른쪽 끝(「지금 여기」) */
  aside?: ReactNode;
  /** 둘째 줄 — 카테고리 칩 · 상태 칩 · 「메모 2」 */
  sub?: ReactNode;
  kind: StopKind;
  tone: StopTone;
  /** 일반 장소 표식의 색 */
  category: PlaceCategory | null;
  /** 들어오는 구간의 선(표식 위). 첫 역은 null */
  inLine: RouteLine | null;
  /** 나가는 구간의 선(표식 아래 ~ 카드 끝). 마지막 역은 null */
  outLine: RouteLine | null;
  /** 펼쳤거나 고른 역 — 카드 테두리 */
  selected?: boolean;
  /** PC — 올린 것처럼 그린다(지도와 맞춘 스크롤 강조) */
  hovered?: boolean;
  /** PC — 첫 줄 오른쪽 끝 「📍5」(지도 핀 번호) */
  pinNo?: number | null;
  onClick?: () => void;
  /** 누르면 카드 안을 펼친다 — 접혀서 칸이 없을 때도 화면 읽기에 「접힘」 을 알린다 */
  expandable?: boolean;
  /** PC — 카드에 올리면 그 핀을 키운다 */
  onHover?: (hovering: boolean) => void;
  /** 카드 안 아래 칸(노트 · 메모 · 버튼 · 기록). 이 칸을 눌러도 접히지 않는다 */
  children?: ReactNode;
};

/**
 * 노선도의 역(장소) 한 줄 — 3열 격자 「시각 48 | 선 28 | 장소 카드」. 표식은 선 칸 가운데, 위에서 24(카드 첫 줄 높이).
 * 들어오는 구간 선은 표식 위, 나가는 구간 선은 표식 아래부터 카드 끝까지 이어진다. 회색 목록 바탕(#F7F8FA) 위에서 쓴다.
 * 남은 역(기록 모드)은 줄 전체를 흐리게 한다
 */
export function RouteStop({
  time,
  name,
  emoji,
  aside,
  sub,
  kind,
  tone,
  category,
  inLine,
  outLine,
  selected = false,
  hovered = false,
  pinNo = null,
  onClick,
  expandable = false,
  onHover,
  children,
}: RouteStopProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-[48px_28px_minmax(0,1fr)] transition-opacity",
        tone === "todo" && "opacity-45",
      )}
      onPointerEnter={onHover && (() => onHover(true))}
      onPointerLeave={onHover && (() => onHover(false))}
    >
      <span className="pt-4.25 pr-1 text-right text-[13px]/4 font-extrabold text-ink-900 tabular-nums">
        {time}
      </span>
      <span className="relative">
        <RouteLineBar line={inLine} className="top-0 h-6" />
        <RouteLineBar line={outLine} className="top-6 bottom-0" />
        <StopMarker
          kind={kind}
          tone={tone}
          category={category}
          className="absolute top-6 left-1/2 z-1 -translate-1/2"
        />
      </span>
      <div className="min-w-0 py-1 pl-1">
        <div
          className={cn(
            "flex flex-col rounded-card border bg-white px-3.5 py-2.75 transition-[border-color,box-shadow] duration-150",
            cardClass(tone, selected, hovered),
            onHover &&
              !selected &&
              "hover:border-route-card-hover hover:shadow-[0_2px_8px_rgba(0,0,0,.07)]",
          )}
        >
          <button
            type="button"
            onClick={onClick}
            aria-expanded={expandable ? selected : undefined}
            className="flex min-w-0 flex-col gap-1.25 text-left"
          >
            <StopTitle emoji={emoji} name={name} aside={aside} pinNo={pinNo} selected={selected} />
            {sub && <span className="flex min-w-0 items-center gap-1.5 empty:hidden">{sub}</span>}
          </button>
          {children && <div className="flex min-w-0 flex-col gap-2 pt-2.25">{children}</div>}
        </div>
      </div>
    </div>
  );
}

type StopTitleProps = Pick<RouteStopProps, "emoji" | "name" | "aside" | "pinNo" | "selected">;

/** 카드 첫 줄 — 이모지 15 + 이름 15/800(말줄임), 오른쪽 끝에 「지금 여기」 · PC 「📍5」 */
function StopTitle({ emoji, name, aside, pinNo = null, selected = false }: StopTitleProps) {
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      {emoji && <span className="shrink-0 text-[15px]">{emoji}</span>}
      <span className="truncate text-[15px] font-extrabold text-[#111]">{name}</span>
      {aside && <span className="ml-auto shrink-0">{aside}</span>}
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
  );
}
