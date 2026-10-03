"use client";

import { CalendarDays, Ellipsis, Trash2 } from "lucide-react";

import type { Trip } from "@/entities/trip";
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
  onDelete: (trip: Trip) => void;
};

/** PC 여행 카드 · 행의 `···` 드롭다운 (시안 6a, 168px). 모바일은 TripActionsSheet. */
export function TripActionsMenu({ trip, canDelete, onEdit, onDelete }: Props) {
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
      <DropdownMenuContent
        align="end"
        className="w-[168px] rounded-card border border-line-card bg-white p-1.5 shadow-[0_6px_20px_rgba(0,0,0,0.12)] ring-0"
      >
        <DropdownMenuItem
          onClick={() => onEdit(trip)}
          className="h-10 gap-2.5 rounded-button px-2.5 text-sm font-semibold text-ink-900 focus:bg-surface-muted"
        >
          <CalendarDays className="size-[18px] text-ink-700" />
          여행일정 수정
        </DropdownMenuItem>
        {canDelete && (
          <DropdownMenuItem
            variant="destructive"
            onClick={() => onDelete(trip)}
            className="h-10 gap-2.5 rounded-button px-2.5 text-sm font-semibold data-[variant=destructive]:focus:bg-[#FDE8EA]"
          >
            <Trash2 className="size-[18px]" />
            여행 삭제
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
