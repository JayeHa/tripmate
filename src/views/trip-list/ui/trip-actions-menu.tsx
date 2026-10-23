"use client";

import { CalendarDays, CloudDownload, Ellipsis, Trash2 } from "lucide-react";

import type { Trip } from "@/entities/trip";
import type { MenuHint } from "@/features/trip/offline-download";
import { cn } from "@/shared/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { IconButton } from "@/shared/ui/icon-button";

type Props = {
  trip: Trip;
  /** 방장만 삭제할 수 있다. 멤버가 지우면 RLS 가 0행을 지우고 에러 없이 끝난다. */
  canDelete: boolean;
  onEdit: (trip: Trip) => void;
  /** 「오프라인용으로 받기」 줄의 오른쪽 힌트 */
  downloadHint: MenuHint;
  onDownload: (trip: Trip) => void;
  onDelete: (trip: Trip) => void;
};

/** PC 여행 카드 · 행의 `···` 드롭다운 — 168px, 「받음」 같은 힌트가 붙으면 252px. 모바일은 TripActionsSheet. */
export function TripActionsMenu({
  trip,
  canDelete,
  onEdit,
  downloadHint,
  onDownload,
  onDelete,
}: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <IconButton
            label={`${trip.title} 메뉴`}
            className="p-1 text-ink-400 data-popup-open:bg-surface-muted"
          />
        }
      >
        <Ellipsis className="size-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={cn(downloadHint.text && "w-63")}>
        <DropdownMenuItem onClick={() => onEdit(trip)}>
          <CalendarDays className="size-4.5 text-ink-700" />
          여행일정 수정
        </DropdownMenuItem>
        {/* 오프라인이면 흐리게 · hover 없음 — 누르면 창 없이 「연결되면 받을 수 있어요」 */}
        <DropdownMenuItem
          onClick={() => onDownload(trip)}
          className={cn(downloadHint.muted && "text-line-dashed focus:bg-transparent")}
        >
          <CloudDownload
            className={cn("size-4.5", downloadHint.muted ? "text-line-dashed" : "text-ink-700")}
          />
          <span className="flex-1">오프라인용으로 받기</span>
          {downloadHint.text && (
            <span className="text-[13px] font-medium whitespace-nowrap text-ink-350">
              {downloadHint.text}
            </span>
          )}
        </DropdownMenuItem>
        {canDelete && (
          <DropdownMenuItem variant="destructive" onClick={() => onDelete(trip)}>
            <Trash2 className="size-4.5" />
            여행 삭제
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
