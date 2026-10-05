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

/** PC 여행 카드 · 행의 `···` 드롭다운(168px). 모바일은 TripActionsSheet. */
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
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(trip)}>
          <CalendarDays className="size-4.5 text-ink-700" />
          여행일정 수정
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
