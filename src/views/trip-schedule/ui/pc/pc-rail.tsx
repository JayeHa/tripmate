import type { Trip } from "@/entities/trip";

import type { usePcDayView } from "../../model/use-pc-day-view";
import type { ScheduleLayoutProps } from "../schedule-layout";
import { DayRail } from "./day-rail";
import { DayViewToggle } from "./day-view-toggle";
import { RailTools } from "./rail-tools";

type PcRailProps = Pick<
  ScheduleLayoutProps,
  "day" | "edit" | "holidayOf" | "onOpenStays" | "stayCount" | "onOpenFlights" | "flightCount"
> & {
  trip: Trip;
  onChange: (day: number) => void;
  /** 「이어서 / 하루씩」 */
  view: ReturnType<typeof usePcDayView>;
};

/**
 * PC 일정 왼쪽 날짜 레일 — 여행 제목 · 「이어서 / 하루씩」 · 날짜 목록 · 아래 숙소 · 항공편.
 * 켜진 날은 보고 있는 날, 편집 중에는 편집하는 날(레일도 편집할 날을 고른다)
 */
export function PcRail({ trip, day, edit, onChange, holidayOf, view, ...tools }: PcRailProps) {
  return (
    <DayRail
      title={trip.title}
      startDate={trip.start_date}
      endDate={trip.end_date}
      day={edit.editing ? edit.day : day}
      onChange={onChange}
      summaries={trip.day_summaries}
      holidayOf={holidayOf}
      footer={<RailTools {...tools} />}
    >
      <DayViewToggle
        mode={view.mode}
        onChange={view.setMode}
        tip={view.tip}
        onTipDismiss={view.dismissTip}
      />
    </DayRail>
  );
}
