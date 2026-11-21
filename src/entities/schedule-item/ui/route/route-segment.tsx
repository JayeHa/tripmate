import { cn } from "@/shared/lib/utils";

import type { RouteTone } from "../../lib/route";
import type { RouteLine } from "../../lib/route-line-style";
import { RouteLineBar } from "./route-line";

/** 구간 글자 색 — [진한 「수단 소요시간」, 옅은 「출발 · 상세」]. 기록 모드의 지나온 구간은 초록, 남은 구간은 계획과 같다(흐리게 하지 않는다 — 선 색으로 구분) */
const TEXT: Record<RouteTone, [string, string]> = {
  plan: ["text-route-walk-text", "text-route-label-sub"],
  done: ["text-visited-text", "text-visited-label-sub"],
  todo: ["text-route-walk-text", "text-route-label-sub"],
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
  /** 구글맵 길찾기 주소 — 줄을 누르면 새 탭. 항공 · 좌표 없는 구간은 없다 */
  href?: string | null;
  /** 길찾기를 연 뒤(토스트) */
  onOpenGmap?: () => void;
  /** 줄 끝 「편집」 — 이동 방법 창. 적을 수 없는 쌍(항공편 · 같은 자리 앞뒤)은 없다 */
  onEdit?: () => void;
  onHover?: (hovering: boolean) => void;
  /** 접근성 이름 「치이카와 파크 → 스카이트리」 */
  ariaLabel?: string;
};

/**
 * 노선도의 구간(카드 사이 이동) 한 줄 — 높이 30(글자 없으면 16). 선 칸에는 구간 선이 이어지고,
 * 내용 칸에는 배경 · 칩 없이 「🚌 버스 1시간 15분 ↗ 10:55 출발 · 상세」 한 줄(넘치면 말줄임) + 끝에 「편집」.
 * 줄을 누르면 구글맵 길찾기(새 탭), 「편집」 은 이동 방법 창
 */
export function RouteSegmentRow({
  tone,
  line,
  icon,
  label,
  meta,
  highlight = false,
  href,
  onOpenGmap,
  onEdit,
  onHover,
  ariaLabel,
}: RouteSegmentRowProps) {
  const [strong, weak] = TEXT[tone];
  const body = (
    <>
      <span aria-hidden="true">{icon}</span>
      <span
        className={cn(
          "shrink-0 font-bold",
          highlight ? "text-[#111] underline underline-offset-3" : strong,
        )}
      >
        {label}
      </span>
      {href && (
        <span
          aria-hidden="true"
          className="shrink-0 text-[11px] font-extrabold text-route-label-sub"
        >
          ↗
        </span>
      )}
      {meta && <span className={cn("truncate", weak)}>{meta}</span>}
    </>
  );
  return (
    <div className={cn("grid grid-cols-[48px_28px_minmax(0,1fr)]", label ? "h-7.5" : "h-4")}>
      <span />
      <span className="relative">
        <RouteLineBar line={line} className="inset-y-0" />
      </span>
      {label && (
        <div className="flex min-w-0 items-center gap-0.5 pl-3 text-xs whitespace-nowrap">
          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              title="구글맵에서 길찾기"
              onClick={onOpenGmap}
              onPointerEnter={onHover && (() => onHover(true))}
              onPointerLeave={onHover && (() => onHover(false))}
              // 이름을 따로 주면 안의 글자 대신 읽히므로 출발 시각 · 상세까지 함께 넣는다
              aria-label={
                ariaLabel
                  ? [`${ariaLabel} 구글맵 길찾기`, label, meta].filter(Boolean).join(" · ")
                  : undefined
              }
              className="flex min-w-0 items-center gap-1.25"
            >
              {body}
            </a>
          ) : (
            <span className="flex min-w-0 items-center gap-1.25">{body}</span>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              aria-label={ariaLabel ? `${ariaLabel} 이동 방법 편집` : "이동 방법 편집"}
              className="ml-0.5 shrink-0 rounded-pill-sm px-1.5 py-1 text-xs font-bold text-primary hover:bg-route-transit-soft"
            >
              편집
            </button>
          )}
        </div>
      )}
    </div>
  );
}
