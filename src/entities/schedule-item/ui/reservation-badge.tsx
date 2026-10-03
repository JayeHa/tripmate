import { CircleAlert, CircleCheck, CircleDashed } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/shared/lib/utils";
import { RESERVATION_STATUS_LABEL, type ReservationStatus } from "../model/reservation-status";

/**
 * 예약 상태 칩. 장소 카드의 제목 위에 놓는다.
 * 상태가 없으면 칩을 그리지 않는다.
 */
const TONE = {
  ok: { icon: CircleCheck, className: "bg-status-ok-bg text-status-ok" },
  wait: { icon: CircleAlert, className: "bg-status-wait-bg text-status-wait" },
  opt: { icon: CircleDashed, className: "bg-status-opt-bg text-status-opt" },
} satisfies Record<ReservationStatus, { icon: typeof CircleCheck; className: string }>;

type Props = Omit<ComponentProps<"span">, "children"> & {
  status: ReservationStatus;
  /** 기본 라벨 대신 쓸 문구. 비우면 상태의 기본 라벨을 쓴다. */
  label?: string;
};

export function ReservationBadge({ className, status, label, ...props }: Props) {
  const { icon: Icon, className: tone } = TONE[status];
  return (
    <span
      data-slot="reservation-badge"
      className={cn(
        "inline-flex h-6 w-fit items-center gap-1 rounded-xl px-2 text-xs font-extrabold whitespace-nowrap",
        tone,
        className,
      )}
      {...props}
    >
      <Icon className="size-3.5" strokeWidth={2} />
      {label || RESERVATION_STATUS_LABEL[status]}
    </span>
  );
}
