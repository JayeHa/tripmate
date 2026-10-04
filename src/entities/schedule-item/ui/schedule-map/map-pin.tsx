import { cn } from "@/shared/lib/utils";

import type { ReservationStatus } from "../../model/reservation-status";

/** 핀 색 = 예약 상태. 타임라인 번호 마커와 같은 의미, 지도 위라 흰 2px 테두리와 그림자를 더한다 */
const PIN_TONE = {
  ok: "border-white bg-status-ok text-white",
  wait: "border-white bg-status-wait text-white",
  opt: "border-dashed border-pin-opt bg-white text-status-opt",
} satisfies Record<ReservationStatus, string>;

const NO_STATUS_PIN = "border-status-opt bg-white text-ink-700";

type MapPinProps = { num: number; status: ReservationStatus | null; selected?: boolean };

/** 지도 위 번호 핀 24px */
export function MapPin({ num, status, selected }: MapPinProps) {
  return (
    <span
      className={cn(
        "flex size-6 items-center justify-center rounded-full border-2 text-xs font-bold shadow-[0_1px_4px_rgba(0,0,0,.3)] transition-transform",
        status ? PIN_TONE[status] : NO_STATUS_PIN,
        selected && "scale-125",
      )}
    >
      {num}
    </span>
  );
}
