import type { Place } from "@/entities/schedule-item";
import { cn } from "@/shared/lib/utils";

import { reviewsLabel } from "../../../lib/guide";

type PinNumberProps = { num: number; placed: boolean; className?: string };

/** 목록 줄 앞 번호 원(24 · 11/800) — 일정에 넣은 곳은 파랑 채움 + 흰 글자, 아니면 회색 2px 테두리 */
export function PinNumber({ num, placed, className }: PinNumberProps) {
  return (
    <span
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold",
        placed ? "bg-status-ok text-white" : "border-2 border-status-opt bg-white text-ink-700",
        className,
      )}
    >
      {num}
    </span>
  );
}

type MetaLineProps = { place: Pick<Place, "rating" | "review_count">; area: string | null };

/** 「★ 4.4 (423) · 이케부쿠로」(13 #999, 별점만 잉크 700). 별점 · 지역이 다 없으면 그리지 않는다 */
export function MetaLine({ place, area }: MetaLineProps) {
  if (place.rating == null && !area) return null;
  return (
    <span className="text-[13px] text-ink-400">
      {place.rating != null && (
        <>
          <b className="font-bold text-ink-900">★ {place.rating.toFixed(1)}</b>{" "}
          {reviewsLabel(place)}
          {area && " · "}
        </>
      )}
      {area}
    </span>
  );
}

type SmallPlacedChipProps = { day: number; size: "sm" | "md" };

/** 「day N 배치됨」 — 목록 줄은 20 · 11/800, 상세 머리는 24 · 12/800 */
export function SmallPlacedChip({ day, size }: SmallPlacedChipProps) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center rounded-full bg-brand-soft font-extrabold whitespace-nowrap text-brand-text",
        size === "sm" ? "h-5 px-1.75 text-[11px]" : "h-6 px-2.25 text-xs",
      )}
    >
      day {day + 1} 배치됨
    </span>
  );
}
