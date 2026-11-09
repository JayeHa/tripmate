import { cn } from "@/shared/lib/utils";

import type { RouteLine, RouteMode, RouteTone } from "../../lib/route";
import { RouteLineBar } from "./route-line";

/** 이동 칩 색 — 계획 모드는 수단, 기록 모드는 지나온 · 남은 구간 */
const PLAN_CHIP: Record<RouteMode, string> = {
  transit: "bg-route-transit-soft text-route-transit-text",
  walk: "bg-route-walk-soft text-route-walk-text",
  flight: "bg-ink-900 text-white",
  none: "",
};

/** 칩 색 */
function chipClass(mode: RouteMode, tone: RouteTone): string {
  if (tone === "done") return "bg-visited-soft text-visited-text";
  if (tone === "todo") return "bg-route-walk-soft text-route-chip-dim";
  return PLAN_CHIP[mode];
}

type RouteSegmentRowProps = {
  mode: RouteMode;
  tone: RouteTone;
  line: RouteLine;
  /** 「🚌 1시간 15분」. null 이면 칩 없는 짧은 구간(20) */
  chip: string | null;
  /** 칩 옆 회색 글자 「버스 · 10:55 출발 · 상세」. 도보는 "" */
  meta: string;
  /** PC — 칩에 올렸다(그 구간을 지도에서 진하게) */
  highlight?: boolean;
  /** 칩을 누르면 — 이동 방법 창 */
  onClick?: () => void;
  onHover?: (hovering: boolean) => void;
  /** 칩의 접근성 이름 「치이카와 파크 → 스카이트리 이동 방법」 */
  label?: string;
};

/**
 * 노선도의 구간(역 사이 이동) 한 줄 — 높이 34(칩 없으면 20). 선 칸에는 구간 선이 이어지고,
 * 내용 칸에는 선에 붙는 연결선(18 × 1.5) + 이동 칩(22) + 옆 글자
 */
export function RouteSegmentRow({
  mode,
  tone,
  line,
  chip,
  meta,
  highlight = false,
  onClick,
  onHover,
  label,
}: RouteSegmentRowProps) {
  return (
    <div className={cn("grid grid-cols-[48px_40px_1fr]", chip ? "h-8.5" : "h-5")}>
      <span />
      <span className="relative">
        <RouteLineBar line={line} className="inset-y-0" />
      </span>
      {chip && (
        <span className="flex min-w-0 items-center py-1.5 pr-2 pl-1.5">
          <span
            aria-hidden="true"
            className={cn(
              "mr-0.5 -ml-5 h-[1.5px] w-4.5 shrink-0",
              tone === "done" ? "bg-visited-line" : "bg-route-branch",
            )}
          />
          <button
            type="button"
            onClick={onClick}
            // 이동 방법을 적을 수 없는 구간(항공편 · 같은 자리 앞뒤)은 누를 것이 없다
            disabled={!onClick}
            onPointerEnter={onHover && (() => onHover(true))}
            onPointerLeave={onHover && (() => onHover(false))}
            aria-label={label ? `${label} · ${chip}` : undefined}
            className={cn(
              "flex h-5.5 shrink-0 items-center rounded-[11px] px-2 text-[11px] font-extrabold whitespace-nowrap",
              chipClass(mode, tone),
              highlight && "shadow-[0_0_0_2px_#111]",
            )}
          >
            {chip}
          </button>
          {meta && (
            <span
              className={cn(
                "ml-1.5 truncate text-[11px] font-semibold",
                tone === "todo" ? "text-route-meta-dim" : "text-route-meta",
              )}
            >
              {meta}
            </span>
          )}
        </span>
      )}
    </div>
  );
}
