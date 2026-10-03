"use client";

import { CalendarDays, Trash2 } from "lucide-react";
import { dateRangeLabel } from "@/shared/lib/days";
import { Sheet, SheetContent, SheetTitle } from "@/shared/ui/sheet";
import type { Trip } from "@/entities/trip";

type Props = {
  trip: Trip | null;
  /** 방장만 삭제할 수 있다. 멤버가 지우면 RLS 가 0행을 지우고 에러 없이 끝난다. */
  canDelete: boolean;
  onClose: () => void;
  onEdit: (trip: Trip) => void;
  onDelete: (trip: Trip) => void;
};

/** 여행 행의 `···` 메뉴 (시안 5a). */
export function TripActionsSheet({ trip, canDelete, onClose, onEdit, onDelete }: Props) {
  return (
    <Sheet open={Boolean(trip)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className="gap-1.5 rounded-t-sheet px-5 pt-2.5 pb-[calc(34px+env(safe-area-inset-bottom))]"
      >
        {trip && (
          <>
            <span aria-hidden="true" className="mx-auto mb-2 h-1 w-9 rounded-sm bg-[#DDD]" />
            <div className="flex flex-col gap-0.5 px-1 pb-2.5">
              <SheetTitle className="text-[17px] font-extrabold text-ink-900">
                {trip.title}
              </SheetTitle>
              <span className="text-[13px] text-ink-400">
                {dateRangeLabel(trip.start_date, trip.end_date)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onEdit(trip)}
              className="flex h-13 items-center gap-3 border-t border-surface-muted px-1 text-base font-semibold text-ink-900"
            >
              <CalendarDays className="size-[22px] text-ink-700" />
              여행일정 수정
            </button>
            {canDelete && (
              <button
                type="button"
                onClick={() => onDelete(trip)}
                className="flex h-13 items-center gap-3 border-t border-surface-muted px-1 text-base font-semibold text-destructive"
              >
                <Trash2 className="size-[22px]" />
                여행 삭제
              </button>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
