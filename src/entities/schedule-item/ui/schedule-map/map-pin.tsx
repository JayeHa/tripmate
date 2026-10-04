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

type MapPinProps = {
  num: number;
  status: ReservationStatus | null;
  category: PlaceCategory | null;
  selected?: boolean;
};

/**
 * 지도 위 번호 핀. 숫자 = 순서, 색 · 테두리 = 예약 상태, 오른쪽 위 배지 = 카테고리(식당 흰색 · 숙소 잉크).
 * 보통 24px, 선택하면 38px.
 */
export function MapPin({ num, status, category, selected }: MapPinProps) {
  const badge = category ? CATEGORY_BADGE[category] : undefined;
  return (
    <span className="relative inline-flex">
      <span
        className={cn(
          "flex items-center justify-center rounded-full border-2 font-bold shadow-[0_1px_4px_rgba(0,0,0,.3)]",
          status ? PIN_TONE[status] : NO_STATUS_PIN,
          selected ? "size-9.5 text-sm" : "size-6 text-xs",
        )}
      >
        {num}
      </span>
      {badge && (
        <span
          className={cn(
            "absolute -top-2 -right-2 flex size-4.25 items-center justify-center rounded-full shadow-[0_1px_3px_rgba(0,0,0,.3)]",
            badge.tone,
          )}
        >
          <badge.icon className="size-2.5" strokeWidth={2.4} />
        </span>
      )}
    </span>
  );
}
