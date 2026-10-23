"use client";

import { CalendarDays, CloudDownload, Trash2 } from "lucide-react";

import type { Trip } from "@/entities/trip";
import type { MenuHint } from "@/features/trip/offline-download";
import { dateRangeLabel } from "@/shared/lib/days";
import { cn } from "@/shared/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@/shared/ui/sheet";
import { SheetMenuItem } from "@/shared/ui/sheet-menu-item";

type Props = {
  trip: Trip | null;
  /** 방장만 삭제할 수 있다. 멤버가 지우면 RLS 가 0행을 지우고 에러 없이 끝난다. */
  canDelete: boolean;
  onClose: () => void;
  onEdit: (trip: Trip) => void;
  /** 「오프라인용으로 받기」 줄의 오른쪽 힌트 */
  downloadHint: (trip: Trip) => MenuHint;
  onDownload: (trip: Trip) => void;
  onDelete: (trip: Trip) => void;
};

/** 여행 행의 `···` 메뉴. */
export function TripActionsSheet({
  trip,
  canDelete,
  onClose,
  onEdit,
  downloadHint,
  onDownload,
  onDelete,
}: Props) {
  const hint = trip ? downloadHint(trip) : null;
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
            <SheetMenuItem
              icon={CalendarDays}
              iconClassName="size-[22px] text-ink-700"
              onClick={() => onEdit(trip)}
              className="border-t border-surface-muted px-1"
            >
              여행일정 수정
            </SheetMenuItem>
            {/* 오프라인이면 흐리게 — 누르면 창 없이 「연결되면 받을 수 있어요」 */}
            <SheetMenuItem
              icon={CloudDownload}
              iconClassName={cn("size-5.5", hint?.muted ? "text-line-dashed" : "text-ink-700")}
              hint={hint?.text}
              onClick={() => onDownload(trip)}
              className={cn(
                "border-t border-surface-muted px-1",
                hint?.muted && "text-line-dashed",
              )}
            >
              오프라인용으로 받기
            </SheetMenuItem>
            {canDelete && (
              <SheetMenuItem
                icon={Trash2}
                iconClassName="size-[22px]"
                danger
                onClick={() => onDelete(trip)}
                className="border-t border-surface-muted px-1"
              >
                여행 삭제
              </SheetMenuItem>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
