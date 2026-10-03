import { cn } from "@/shared/lib/utils";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

type WeekdaysProps = { className?: string };

/** 달력 요일 머리. 일·토는 빨갛다. */
export function Weekdays({ className }: WeekdaysProps) {
  return (
    <div className={cn("grid grid-cols-7", className)}>
      {WEEKDAYS.map((label, i) => (
        <span
          key={label}
          className={cn("text-center", i === 0 || i === 6 ? "text-destructive" : "text-ink-400")}
        >
          {label}
        </span>
      ))}
    </div>
  );
}
