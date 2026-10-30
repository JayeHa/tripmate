"use client";

import { ChevronRight } from "lucide-react";

import { dayCount, dayParts } from "@/shared/lib/days";
import { SheetDialog } from "@/shared/ui/sheet-dialog";

import type { GuideActions } from "../../model/use-guide-actions";

type GuideDayPickerProps = {
  day: GuideActions["day"];
  /** 장소 이름 — 제목 아래 */
  name: string | null;
  startDate: string;
  endDate: string;
};

/** 「+ 일정」 — 어느 날에 넣을지. 고르면 그날 맨 끝에 넣고 닫는다(시간 · 순서는 일정 화면에서) */
export function GuideDayPicker({ day, name, startDate, endDate }: GuideDayPickerProps) {
  const days = Array.from({ length: dayCount(startDate, endDate) }, (_, i) => i);
  return (
    <SheetDialog
      open={day.placeId !== null}
      onClose={day.cancel}
      title="어느 날에 넣을까요?"
      locked={day.pending}
    >
      {name && (
        <p className="-mt-2 pb-2 text-[13px] text-ink-400">{name} · 그날 맨 끝에 들어가요</p>
      )}
      <ul className="flex flex-col">
        {days.map((i) => {
          const { date, dow } = dayParts(startDate, i);
          return (
            <li key={i}>
              <button
                type="button"
                disabled={day.pending}
                onClick={() => day.pick(i)}
                className="flex h-13 w-full cursor-pointer items-center gap-3 border-b border-surface-muted text-left disabled:opacity-50"
              >
                <span className="w-14 text-[15px] font-extrabold text-ink-900">day {i + 1}</span>
                <span className="flex-1 text-sm text-ink-500">
                  {date} ({dow})
                </span>
                <ChevronRight className="size-4.5 text-ink-350" aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>
      {day.error && <p className="pt-3 text-[13px] text-destructive">넣지 못했어요: {day.error}</p>}
    </SheetDialog>
  );
}
