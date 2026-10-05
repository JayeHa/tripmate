import { cn } from "@/shared/lib/utils";

import {
  RESERVATION_STATUS_LABEL,
  RESERVATION_STATUSES,
  type ReservationStatus,
} from "../model/reservation-status";
import { RESERVATION_TONE } from "./reservation-badge";

type ReservationStatusPickerProps = {
  value: ReservationStatus | null;
  onChange: (status: ReservationStatus | null) => void;
};

/**
 * 예약 상태 고르기(P7) — 32 pill 「없음 · 예약 확정 · 예약 필요 · 임시」.
 * 고른 상태는 그 상태 색 + 아이콘 14, 안 고른 칸은 흰 바탕 #E3E5E8 테두리. 「없음」 은 늘 점선(고르면 #F2F3F5 채움)
 */
export function ReservationStatusPicker({ value, onChange }: ReservationStatusPickerProps) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="예약 상태">
      <button
        type="button"
        aria-pressed={value === null}
        onClick={() => onChange(null)}
        className={cn(
          "flex h-8 items-center rounded-full border border-dashed border-line-dashed px-3 text-[13px] font-bold text-ink-400",
          value === null ? "bg-surface-muted" : "bg-white",
        )}
      >
        없음
      </button>
      {RESERVATION_STATUSES.map((s) => {
        const on = value === s;
        const { icon: Icon, className: tone } = RESERVATION_TONE[s];
        return (
          <button
            key={s}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(s)}
            className={cn(
              "flex h-8 items-center gap-1 rounded-full border px-3 text-[13px] font-bold",
              on ? cn("border-transparent", tone) : "border-line bg-white text-ink-500",
            )}
          >
            {on && <Icon className="size-3.5" strokeWidth={2.2} />}
            {RESERVATION_STATUS_LABEL[s]}
          </button>
        );
      })}
    </div>
  );
}
