"use client";

import { CalendarDays } from "lucide-react";

import { useTrip } from "@/entities/trip";
import type { VoucherTargetRef } from "@/entities/voucher";
import { TargetPicker, useTargetSources } from "@/features/checklist";
import { dayCount } from "@/shared/lib/days";

import { dayText, targetDay } from "../lib/voucher-day";

type VoucherTargetFieldProps = {
  tripId: string;
  value: VoucherTargetRef | null;
  onChange: (target: VoucherTargetRef | null) => void;
};

/**
 * 바우처 폼의 「연결된 일정」 — 하나만 고르는 칸, 골랐으면 아래 회색으로 그 날짜(「day 2 · 10.21」, 숙소는 체크인 날).
 * 연결하면 사용일 대신 이 날짜를 쓴다
 */
export function VoucherTargetField({ tripId, value, onChange }: VoucherTargetFieldProps) {
  const src = useTargetSources(tripId);
  const { data: trip } = useTrip(tripId);
  const day =
    value && src && trip ? targetDay(value, src, dayCount(trip.start_date, trip.end_date)) : null;
  return (
    <>
      <TargetPicker tripId={tripId} value={value} onChange={onChange} />
      {value && trip && (
        <span className="flex items-center gap-1 text-xs text-ink-400">
          <CalendarDays className="size-3.25 text-ink-350" aria-hidden="true" />
          {dayText(trip.start_date, day)}
        </span>
      )}
    </>
  );
}
