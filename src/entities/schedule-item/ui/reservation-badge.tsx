import { CircleAlert, CircleCheck, CircleDashed } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/utils";

import { RESERVATION_STATUS_LABEL, type ReservationStatus } from "../model/reservation-status";

/**
 * 예약 상태 칩. 장소 카드의 제목 위에 놓는다.
 * 상태가 없으면 칩을 그리지 않는다.
 */
export const RESERVATION_TONE = {
  ok: { icon: CircleCheck, className: "bg-status-ok-bg text-status-ok" },
  wait: { icon: CircleAlert, className: "bg-status-wait-bg text-status-wait-text" },
  opt: { icon: CircleDashed, className: "bg-status-opt-bg text-status-opt" },
} satisfies Record<ReservationStatus, { icon: typeof CircleCheck; className: string }>;

type Props = Omit<ComponentProps<"span">, "children"> & {
  status: ReservationStatus;
  /** 기본 라벨 대신 쓸 문구. 비우면 상태의 기본 라벨을 쓴다. */
  label?: string;
};

export function ReservationBadge({ className, status, label, ...props }: Props) {
  const { icon: Icon, className: tone } = RESERVATION_TONE[status];
  return (
    <span
      data-slot="reservation-badge"
      className={cn(
        // 표시용 배지 20 · r5 · 11/800
        "inline-flex h-5 w-fit items-center gap-0.75 rounded-[5px] px-1.5 text-[11px] font-extrabold whitespace-nowrap",
        tone,
        className,
      )}
      {...props}
    >
      <Icon className="size-3" strokeWidth={2.2} />
      {label || RESERVATION_STATUS_LABEL[status]}
    </span>
  );
}
