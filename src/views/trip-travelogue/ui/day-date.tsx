import { dayLabel } from "@/shared/lib/days";
import { cn } from "@/shared/lib/utils";

type DayDateProps = {
  startDate: string;
  day: number;
  /** 여행지 공휴일 이름 — 날짜 글자만 빨갛게 + 「· 문화의 날」. 주말은 칠하지 않는다 */
  holiday: string | null;
  className?: string;
};

/** 「10.31 (토)」 — 공휴일이면 빨간 글자 + 「· 문화의 날」(700) */
export function DayDate({ startDate, day, holiday, className }: DayDateProps) {
  return (
    <span className={cn(holiday && "text-holiday", className)}>
      {dayLabel(startDate, day)}
      {holiday && <span className="font-bold"> · {holiday}</span>}
    </span>
  );
}
