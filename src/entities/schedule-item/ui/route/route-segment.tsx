import { cn } from "@/shared/lib/utils";

import type { RouteLine, RouteTone } from "../../lib/route";
import { RouteLineBar } from "./route-line";

/** 구간 글자 색 — [진한 「수단 소요시간」, 옅은 「출발 · 상세」]. 기록 모드는 지나온 초록 · 남은 연회색 */
const TEXT: Record<RouteTone, [string, string]> = {
  plan: ["text-route-walk-text", "text-route-label-sub"],
  done: ["text-visited-text", "text-visited-label-sub"],
  todo: ["text-route-chip-dim", "text-route-branch"],
};

type RouteSegmentRowProps = {
  tone: RouteTone;
  line: RouteLine;
  /** 「🚌」 */
  icon: string;
  /** 「버스 1시간 15분」. null 이면 글자 없는 짧은 구간(16) */
  label: string | null;
  /** 옅은 뒷글자 「10:55 출발 · TYO-NRT 긴자행」. 없으면 "" */
  meta: string;
  /** PC — 글자에 올렸다(그 구간을 지도에서 진하게) — 글자를 잉크색 밑줄로 */
  highlight?: boolean;
  /** 글자를 누르면 — 이동 방법 창 */
  onClick?: () => void;
  onHover?: (hovering: boolean) => void;
  /** 접근성 이름 「치이카와 파크 → 스카이트리 이동 방법」 */
  ariaLabel?: string;
};

/**
 * 노선도의 구간(카드 사이 이동) 한 줄 — 높이 30(글자 없으면 16). 선 칸에는 구간 선이 이어지고,
 * 내용 칸에는 배경 · 칩 없이 「🚌 버스 1시간 15분  10:55 출발 · 상세」 한 줄(넘치면 말줄임)
 */
export function RouteSegmentRow({
  tone,
  line,
  icon,
  label,
  meta,
  highlight = false,
  onClick,
  onHover,
  ariaLabel,
}: RouteSegmentRowProps) {
  const [strong, weak] = TEXT[tone];
  return (
    <div className={cn("grid grid-cols-[48px_28px_minmax(0,1fr)]", label ? "h-7.5" : "h-4")}>
      <span />
      <span className="relative">
        <RouteLineBar line={line} className="inset-y-0" />
      </span>
      {label && (
        <button
          type="button"
          onClick={onClick}
          // 이동 방법을 적을 수 없는 구간(항공편 · 같은 자리 앞뒤)은 누를 것이 없다
          disabled={!onClick}
          onPointerEnter={onHover && (() => onHover(true))}
          onPointerLeave={onHover && (() => onHover(false))}
          aria-label={ariaLabel ? `${ariaLabel} · ${label}` : undefined}
          className="flex min-w-0 items-center gap-1.25 pl-3 text-left text-xs whitespace-nowrap"
        >
          <span aria-hidden="true">{icon}</span>
          <span
            className={cn(
              "shrink-0 font-bold",
              highlight ? "text-[#111] underline underline-offset-3" : strong,
            )}
          >
            {label}
          </span>
          {meta && <span className={cn("truncate", weak)}>{meta}</span>}
        </button>
      )}
    </div>
  );
}
