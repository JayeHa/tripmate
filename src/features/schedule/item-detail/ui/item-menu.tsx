"use client";

import { CalendarDays, Ellipsis, Trash2 } from "lucide-react";
import { useState } from "react";

import { dayLabel } from "@/shared/lib/days";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { IconButton } from "@/shared/ui/icon-button";

import type { ItemActions } from "../model/use-item-actions";

const ITEM_CLASS =
  "h-10 gap-2.5 rounded-button px-2.5 text-sm font-semibold text-ink-900 focus:bg-surface-muted";

type ItemMenuProps = {
  actions: ItemActions;
  /** 지금 날(0-base) — 「다른 날로」 목록에서 뺀다 */
  dayIndex: number;
  /** 이 일정의 대체 장소 수 — 지우면 함께 지워진다고 알린다 */
  alternativeCount: number;
  startDate: string;
  totalDays: number;
};

/**
 * 상세 머리의 ⋯ — 다른 날로 · 삭제(확인 후). 순서 바꾸기는 일정 편집에서 한다.
 */
export function ItemMenu({
  actions,
  dayIndex,
  alternativeCount,
  startDate,
  totalDays,
}: ItemMenuProps) {
  const [confirming, setConfirming] = useState(false);
  const days = Array.from({ length: totalDays }, (_, i) => i).filter((i) => i !== dayIndex);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <IconButton
              label="일정 메뉴"
              className="p-1 text-ink-400 data-popup-open:bg-surface-muted"
            />
          }
        >
          <Ellipsis className="size-5.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-44 rounded-card border border-line-card bg-white p-1.5 shadow-[0_6px_20px_rgba(0,0,0,0.12)] ring-0"
        >
          {days.length > 0 && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className={ITEM_CLASS}>
                <CalendarDays className="size-4.5 text-ink-700" />
                다른 날로
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="rounded-card border border-line-card bg-white p-1.5 ring-0">
                {days.map((d) => (
                  <DropdownMenuItem
                    key={d}
                    onClick={() => actions.moveTo(d)}
                    className={ITEM_CLASS}
                  >
                    day {d + 1} · {dayLabel(startDate, d)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setConfirming(true)}
            className="h-10 gap-2.5 rounded-button px-2.5 text-sm font-semibold data-[variant=destructive]:focus:bg-destructive-soft"
          >
            <Trash2 className="size-4.5" />
            일정 삭제
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>이 일정을 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              {alternativeCount > 0
                ? `이 일정의 시간 · 메모 · 링크와 대체 장소 ${alternativeCount}곳이 지워져요.`
                : "이 일정의 시간 · 메모 · 링크가 지워져요."}{" "}
              장소는 저장한 장소에 남아요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction variant="danger" onClick={actions.remove}>
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
