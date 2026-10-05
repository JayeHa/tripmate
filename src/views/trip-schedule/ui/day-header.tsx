import { ChevronsDownUp, ChevronsUpDown } from "lucide-react";

import { dayParts } from "@/shared/lib/days";

type DayHeaderProps = {
  startDate: string;
  day: number;
  /** 그날 메모 있는 카드가 하나라도 있으면 「메모 모두 펼치기/접기」를 보인다 */
  hasMemos: boolean;
  allOpen: boolean;
  onToggleAll: () => void;
  /** 있으면(PC) 버튼 줄 왼쪽에 「메모 N개 · 장소 N곳」 */
  counts?: { memos: number; places: number };
  /** 제목 오른쪽 「편집」. 일정을 다 읽기 전에는 없다 */
  onEdit?: () => void;
};

/**
 * 「day 1  10.31/토」 · 오른쪽 「편집」(일정 편집을 연다). 하루 요약은 아직 없다.
 * 아래 줄에 메모를 한꺼번에 펼치고 접는 버튼(PC 는 왼쪽에 메모 · 장소 개수).
 */
export function DayHeader({
  startDate,
  day,
  hasMemos,
  allOpen,
  onToggleAll,
  counts,
  onEdit,
}: DayHeaderProps) {
  const { date, dow } = dayParts(startDate, day);
  const Icon = allOpen ? ChevronsDownUp : ChevronsUpDown;
  return (
    <>
      <div className="flex items-center justify-between px-5 pt-4.5 pb-1.5">
        <div className="flex items-baseline gap-1.5">
          <h2 className="text-[17px] font-extrabold text-ink-900">day {day + 1}</h2>
          <span className="text-base text-ink-400">
            {date}/{dow}
          </span>
        </div>
        {onEdit && (
          <button type="button" onClick={onEdit} className="text-[15px] text-ink-500">
            편집
          </button>
        )}
      </div>
      {(hasMemos || counts) && (
        <div className="flex items-center justify-end gap-3 px-5 pb-1.5">
          {counts && (
            <span className="mr-auto text-[13px] text-ink-400">
              메모 {counts.memos}개 · 장소 {counts.places}곳
            </span>
          )}
          {hasMemos && (
            <button
              type="button"
              onClick={onToggleAll}
              className="flex h-8 items-center gap-1.25 rounded-2xl border border-line bg-white px-3 text-[13px] font-bold text-ink-700"
            >
              <Icon className="size-3.75" />
              {allOpen ? "메모 모두 접기" : "메모 모두 펼치기"}
            </button>
          )}
        </div>
      )}
    </>
  );
}
