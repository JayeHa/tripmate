import { ChevronDown } from "lucide-react";

import { dayLabel } from "@/shared/lib/days";

type EditDaySelectProps = {
  startDate: string;
  totalDays: number;
  day: number;
  onChange: (day: number) => void;
};

/** 편집할 날 고르기 — 「day N · 날짜」 34 높이 pill(기본 select) */
export function EditDaySelect({ startDate, totalDays, day, onChange }: EditDaySelectProps) {
  return (
    <span className="relative flex items-center">
      <select
        value={day}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="편집할 날"
        className="h-8.5 cursor-pointer appearance-none rounded-full border border-line bg-white pr-7.5 pl-3 text-sm font-bold text-ink-900 outline-none focus-visible:border-primary"
      >
        {Array.from({ length: totalDays }, (_, i) => i).map((d) => (
          <option key={d} value={d}>
            day {d + 1} · {dayLabel(startDate, d)}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 size-3.75 text-ink-500" />
    </span>
  );
}
