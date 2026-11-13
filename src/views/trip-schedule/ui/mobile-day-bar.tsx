import { type DayMode, DayModeToggle } from "@/entities/schedule-item";
import { DayChips } from "@/features/schedule/day-selector";

type MobileDayBarProps = {
  startDate: string;
  totalDays: number;
  day: number;
  onDayChange: (day: number) => void;
  holidayOf: (day: number) => string | null;
  mode: DayMode;
  onModeChange: (mode: DayMode) => void;
};

/**
 * 모바일 일정의 붙는 줄 — 날짜 칩(왼쪽, 칩만 가로로 스크롤) + 「계획 | 기록」(오른쪽 끝에 고정).
 * 「계획 | 기록」 이 여기 있어서 어느 날을 보고 있든 바꿀 수 있다. 칩은 세그먼트 아래로 지나가지 않고 그 앞에서 흐려지며 잘린다
 */
export function MobileDayBar({
  startDate,
  totalDays,
  day,
  onDayChange,
  holidayOf,
  mode,
  onModeChange,
}: MobileDayBarProps) {
  return (
    <div className="flex">
      <div className="min-w-0 flex-1">
        <DayChips
          startDate={startDate}
          totalDays={totalDays}
          value={day}
          onChange={onDayChange}
          holidayOf={holidayOf}
        />
      </div>
      {/* 칩 줄과 같은 위 · 아래 여백 · 밑줄. 왼쪽의 흰 그러데이션(16)이 잘리는 칩을 흐린다 */}
      <div className="relative shrink-0 border-b border-divider bg-white pt-0.5 pr-4 pb-2.5 before:pointer-events-none before:absolute before:inset-y-0 before:-left-4 before:w-4 before:bg-linear-to-r before:from-white/0 before:to-white">
        <DayModeToggle value={mode} onChange={onModeChange} />
      </div>
    </div>
  );
}
