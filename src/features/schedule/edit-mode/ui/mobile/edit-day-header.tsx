import { dayParts } from "@/shared/lib/days";

import { EditDaySelect } from "../edit-day-select";

type EditDayHeaderProps = {
  startDate: string;
  totalDays: number;
  day: number;
  onDayChange: (day: number) => void;
};

/** 편집하는 날 — 「day 3 11.2/월」 + 오른쪽 날짜 고르기 */
export function EditDayHeader({ startDate, totalDays, day, onDayChange }: EditDayHeaderProps) {
  const { date, dow } = dayParts(startDate, day);
  return (
    <div className="flex items-center justify-between px-5 pt-5.5 pb-3">
      <span className="flex gap-1.5 text-base font-extrabold text-ink-900">
        day {day + 1}
        <span className="font-semibold text-ink-350">
          {date}/{dow}
        </span>
      </span>
      <EditDaySelect startDate={startDate} totalDays={totalDays} day={day} onChange={onDayChange} />
    </div>
  );
}
