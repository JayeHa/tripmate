import { Plane } from "lucide-react";

import { cn } from "@/shared/lib/utils";

import type { ItemKind } from "../../model/place";
import type { ReservationStatus } from "../../model/reservation-status";

/** 번호 원의 색 = 예약 상태. 지도 핀도 같은 색을 쓴다 */
const NO_STATUS_TONE = "border-[1.5px] border-handle bg-white text-ink-500";
const STATUS_TONE = {
  ok: "bg-status-ok text-white",
  wait: "bg-status-wait text-white",
  opt: "border-[1.5px] border-dashed border-marker-opt bg-white text-status-opt",
} satisfies Record<ReservationStatus, string>;

type NumberMarkerProps = {
  kind: ItemKind;
  num: number | null;
  status: ReservationStatus | null;
};

/** 타임라인 왼쪽 거터의 표식. place 는 번호, 나머지는 종류별 아이콘이나 점 */
export function NumberMarker({ kind, num, status }: NumberMarkerProps) {
  if (kind === "flight") {
    return (
      <span className="flex size-6.5 shrink-0 items-center justify-center rounded-full bg-primary">
        <Plane className="size-3.5 text-white" />
      </span>
    );
  }
  if (kind === "note") {
    return <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-primary" />;
  }
  return (
    <span
      className={cn(
        "flex size-6.5 shrink-0 items-center justify-center rounded-full text-[13px] font-bold",
        status ? STATUS_TONE[status] : NO_STATUS_TONE,
      )}
    >
      {num}
    </span>
  );
}
