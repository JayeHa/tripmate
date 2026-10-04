import { BedDouble, type LucideIcon, Utensils } from "lucide-react";

import { cn } from "@/shared/lib/utils";

import type { PlaceCategory } from "../../model/place";
import type { ReservationStatus } from "../../model/reservation-status";

/** 핀 색 = 예약 상태. 타임라인 번호 마커와 같은 의미, 지도 위라 흰 2px 테두리와 그림자를 더한다 */
const PIN_TONE = {
  ok: "border-white bg-status-ok text-white",
  wait: "border-white bg-status-wait text-white",
  opt: "border-dashed border-pin-opt bg-white text-status-opt",
} satisfies Record<ReservationStatus, string>;

const NO_STATUS_PIN = "border-status-opt bg-white text-ink-700";

/**
 * 카테고리 배지는 식당 · 숙소에만. 지도에서 끼니와 잠자리를 번호 · 상태색과 겹치지 않게 알아보게 한다.
 * 식당은 흰 배지, 숙소만 잉크 배지 — 하루에 한 번뿐인 숙소가 그날의 기준점처럼 도드라진다.
 */
const CATEGORY_BADGE: Partial<Record<PlaceCategory, { icon: LucideIcon; tone: string }>> = {
  food: { icon: Utensils, tone: "bg-white text-ink-700" },
  stay: { icon: BedDouble, tone: "bg-ink-900 text-white" },
};

/** 강조 핀의 34px 원. 흰 물방울 위라 확정 · 필요는 흰 테두리 없이 채우기만 한다 */
const FOCUS_TONE = {
  ok: "bg-status-ok text-white",
  wait: "bg-status-wait text-white",
  opt: "border-2 border-dashed border-pin-opt bg-white text-status-opt",
} satisfies Record<ReservationStatus, string>;

const NO_STATUS_FOCUS = "border-2 border-status-opt bg-white text-ink-700";

/** 보통 핀 지름. 모바일 지도는 작아서 24, PC 3단 지도는 28 */
const PIN_SIZE = { md: "size-6", lg: "size-7" } as const;
export type MapPinSize = keyof typeof PIN_SIZE;

/**
 * 핀이 좌표에 닿는 점(AdvancedMarker 의 anchorLeft · anchorTop). 보통 핀은 원 중심,
 * 강조 핀은 물방울 끝(44×54 상자의 22, 52). 기본값(아래 가운데)을 쓰면 원이 반지름만큼 위로 뜬다.
 */
export function pinAnchor(focus: boolean) {
  return focus
    ? { anchorLeft: "-22px", anchorTop: "-52px" }
    : { anchorLeft: "-50%", anchorTop: "-50%" };
}

type MapPinProps = {
  num: number;
  size?: MapPinSize;
  status: ReservationStatus | null;
  category: PlaceCategory | null;
  /** 지금 보고 있는 장소(목록 스크롤 · 핀 선택). 흰 물방울 강조 핀으로 그린다 */
  focus?: boolean;
};

/**
 * 지도 위 번호 핀. 숫자 = 순서, 색 · 테두리 = 예약 상태, 오른쪽 위 배지 = 카테고리(식당 흰색 · 숙소 잉크).
 * 보통 핀: 숫자 12/800, 그림자 0 1px 4px .28, 배지 17px(-8/-8).
 * 강조 핀: 44px 흰 물방울(그림자 0 3px 10px .28) 안에 34px 원 + 숫자 15/800, 배지 19px(-6/-6).
 */
export function MapPin({ num, size = "md", status, category, focus }: MapPinProps) {
  if (focus) {
    return (
      <span className="relative block h-13.5 w-11">
        {/* 왼쪽 아래만 각진 원을 -45° 돌리면 각진 모서리가 아래 가운데로 와서 물방울 끝이 된다 */}
        <span className="absolute top-0 left-0 size-11 -rotate-45 rounded-[50%_50%_50%_0] bg-white shadow-[0_3px_10px_rgba(0,0,0,.28)]" />
        <span
          className={cn(
            "absolute top-1.25 left-1.25 flex size-8.5 items-center justify-center rounded-full text-[15px] font-extrabold",
            status ? FOCUS_TONE[status] : NO_STATUS_FOCUS,
          )}
        >
          {num}
        </span>
        <CategoryBadge category={category} className="-top-1.5 -right-1.5 size-4.75" />
      </span>
    );
  }
  return (
    <span className="relative inline-flex">
      <span
        className={cn(
          "flex items-center justify-center rounded-full border-2 text-xs font-extrabold shadow-[0_1px_4px_rgba(0,0,0,.28)]",
          status ? PIN_TONE[status] : NO_STATUS_PIN,
          PIN_SIZE[size],
        )}
      >
        {num}
      </span>
      <CategoryBadge category={category} className="-top-2 -right-2 size-4.25" />
    </span>
  );
}

type CategoryBadgeProps = { category: PlaceCategory | null; className: string };

/** 핀 오른쪽 위 카테고리 배지. 식당 · 숙소가 아니면 그리지 않는다. 위치 · 크기는 핀 종류가 정한다 */
function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const badge = category ? CATEGORY_BADGE[category] : undefined;
  if (!badge) return null;
  return (
    <span
      className={cn(
        "absolute flex items-center justify-center rounded-full shadow-[0_1px_3px_rgba(0,0,0,.3)]",
        badge.tone,
        className,
      )}
    >
      <badge.icon className="size-2.75" strokeWidth={2.4} />
    </span>
  );
}
