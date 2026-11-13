import { DayModeToggle } from "@/entities/schedule-item";
import type { Trip } from "@/entities/trip";

import { placeProgress } from "../../lib/record";
import type { usePcDayView } from "../../model/use-pc-day-view";
import type { ScheduleLayoutProps } from "../schedule-layout";
import { DayRail } from "./day-rail";
import { DayViewToggle } from "./day-view-toggle";
import { RailTools } from "./rail-tools";

type PcRailProps = Pick<
  ScheduleLayoutProps,
  | "day"
  | "edit"
  | "holidayOf"
  | "onOpenStays"
  | "stayCount"
  | "onOpenFlights"
  | "flightCount"
  | "sections"
  | "mode"
  | "onModeChange"
  | "record"
> & {
  trip: Trip;
  onChange: (day: number) => void;
  /** 「이어서 / 하루씩」 */
  view: ReturnType<typeof usePcDayView>;
};

/**
 * PC 일정 왼쪽 날짜 레일 — 여행 제목 · 「계획 | 기록」(편집 중에는 없다) · 「이어서 / 하루씩」 · 날짜 목록 · 아래 숙소 · 항공편.
 * 켜진 날은 보고 있는 날, 편집 중에는 편집하는 날(레일도 편집할 날을 고른다).
 * 기록 모드(편집 중이 아닐 때)는 날마다 하루 요약 대신 다녀온 곳 진행 줄
 */
export function PcRail({
  trip,
  day,
  edit,
  onChange,
  holidayOf,
  view,
  sections,
  mode,
  onModeChange,
  record,
  ...tools
}: PcRailProps) {
  const recording = mode === "record" && !edit.editing;
  return (
    <DayRail
      title={trip.title}
      startDate={trip.start_date}
      endDate={trip.end_date}
      day={edit.editing ? edit.day : day}
      onChange={onChange}
      summaries={trip.day_summaries}
      holidayOf={holidayOf}
      progressOf={
        recording ? (d) => placeProgress(sections[d]?.rows ?? [], record.marks) : undefined
      }
      footer={<RailTools {...tools} />}
    >
      {!edit.editing && (
        // 첫 사용 말풍선이 가리키는 자리 — 세그먼트와 같은 크기 · 모서리
        <div data-coach="mode" className="mt-2.5 rounded-memo">
          <DayModeToggle value={mode} onChange={onModeChange} className="grid grid-cols-2" />
        </div>
      )}
      <DayViewToggle
        mode={view.mode}
        onChange={view.setMode}
        tip={view.tip}
        onTipDismiss={view.dismissTip}
      />
    </DayRail>
  );
}
