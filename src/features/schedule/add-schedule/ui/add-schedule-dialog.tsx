"use client";

import type { ScheduleItem } from "@/entities/schedule-item";
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";

import { type DirectAddRequest, useAddSchedule } from "../model/use-add-schedule";
import { AddScheduleFilters } from "./add-schedule-filters";
import { AddScheduleFooter } from "./add-schedule-footer";
import { AddScheduleHeader } from "./add-schedule-header";
import { AddScheduleList } from "./add-schedule-list";

type AddScheduleDialogProps = {
  tripId: string;
  startDate: string;
  totalDays: number;
  /** 여는 날(보고 있던 날). 화면 안에서 바꿀 수 있다 */
  initialDay: number;
  /** 여행 전체 일정 */
  items: ScheduleItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 「‘검색어’ 직접 추가」 — 화면이 장소 입력 폼을 연다. 폼에서 담으면 화면이 이 창도 닫는다 */
  onDirectAdd: (request: DirectAddRequest) => void;
};

/**
 * 「일정 추가」. 1024px 아래는 전체 화면, 이상은 가운데 480×700 모달 — 내용 구조가 같아 틀의 크기만 나눈다.
 * 열릴 때마다 본문을 새로 마운트해 검색어 · 고른 곳 · 날짜가 처음 값에서 시작한다.
 */
export function AddScheduleDialog({ open, onOpenChange, ...rest }: AddScheduleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="inset-0 flex h-dvh w-full max-w-none translate-0 flex-col gap-0 overflow-hidden rounded-none bg-white p-0 ring-0 sm:max-w-none lg:inset-auto lg:top-1/2 lg:left-1/2 lg:h-[min(700px,calc(100dvh-2rem))] lg:w-120 lg:max-w-120 lg:-translate-1/2 lg:rounded-sheet lg:shadow-sheet"
      >
        {open && <AddScheduleBody {...rest} onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

type AddScheduleBodyProps = Omit<AddScheduleDialogProps, "open" | "onOpenChange"> & {
  onClose: () => void;
};

/** 다이얼로그 내용. 상태는 useAddSchedule 이 쥐고 조각들은 그리기만 한다 */
function AddScheduleBody({
  tripId,
  startDate,
  totalDays,
  initialDay,
  items,
  onDirectAdd,
  onClose,
}: AddScheduleBodyProps) {
  const state = useAddSchedule({ tripId, initialDay, items, onDone: onClose, onDirectAdd });
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col">
      <AddScheduleHeader
        startDate={startDate}
        totalDays={totalDays}
        dayIndex={state.dayIndex}
        onDayChange={state.setDayIndex}
        onClose={onClose}
        Title={DialogTitle}
      />
      <AddScheduleFilters state={state} />
      <AddScheduleList state={state} />
      <AddScheduleFooter state={state} />
    </div>
  );
}
