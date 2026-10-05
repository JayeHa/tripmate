"use client";

import { CalendarDays, ChevronLeft, ChevronRight, Ellipsis, Trash2 } from "lucide-react";
import { useState } from "react";

import { dayParts } from "@/shared/lib/days";
import { cn } from "@/shared/lib/utils";
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
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

import type { ItemActions } from "../model/use-item-actions";

/** 메뉴 줄 — 모바일 44 · 15 · 아이콘 18, PC 40 · 14 · 아이콘 16 */
const ROW = "h-11 text-[15px] lg:h-10 lg:text-sm [&_svg]:size-4.5 lg:[&_svg]:size-4";

type ItemMenuProps = {
  actions: ItemActions;
  /** 지금 날(0-base) — day 목록에서 회색 「지금」 */
  dayIndex: number;
  /** 이 일정의 대체 장소 수 — 지우면 함께 지워진다고 알린다 */
  alternativeCount: number;
  startDate: string;
  totalDays: number;
};

/**
 * 상세 머리의 ⋯ — 「다른 날로 ›」 · 「일정 삭제」(확인 후). 「다른 날로」 를 누르면 같은 메뉴가 「‹ 다른 날로」 + day 목록으로 바뀐다
 * (지금 날짜는 회색 「지금」 · 고를 수 없음). 고르면 그날 맨 끝으로 옮기고 상세가 닫힌다. 순서 바꾸기는 일정 편집에서
 */
export function ItemMenu({
  actions,
  dayIndex,
  alternativeCount,
  startDate,
  totalDays,
}: ItemMenuProps) {
  const [open, setOpen] = useState(false);
  const [pickingDay, setPickingDay] = useState(false);
  const [confirming, setConfirming] = useState(false);
  return (
    <>
      <DropdownMenu
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setPickingDay(false);
        }}
      >
        <DropdownMenuTrigger
          aria-label="일정 메뉴"
          className="flex size-9 shrink-0 items-center justify-center rounded-memo text-ink-500 data-popup-open:bg-divider"
        >
          <Ellipsis className="size-5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-50">
          {pickingDay ? (
            <DayList
              dayIndex={dayIndex}
              startDate={startDate}
              totalDays={totalDays}
              onBack={() => setPickingDay(false)}
              onPick={actions.moveTo}
            />
          ) : (
            <>
              {totalDays > 1 && (
                <>
                  <DropdownMenuItem
                    closeOnClick={false}
                    onClick={() => setPickingDay(true)}
                    className={cn(ROW, "text-ink-900 [&_svg]:text-ink-700")}
                  >
                    <CalendarDays />
                    <span className="flex-1">다른 날로</span>
                    <ChevronRight className="text-ink-400" />
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setConfirming(true)}
                className={ROW}
              >
                <Trash2 />
                일정 삭제
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>일정을 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              {alternativeCount > 0
                ? `이 일정의 메모 · 링크와 대체 장소 ${alternativeCount}곳이 함께 지워져요.`
                : "이 일정의 메모 · 링크가 함께 지워져요."}{" "}
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

type DayListProps = {
  dayIndex: number;
  startDate: string;
  totalDays: number;
  onBack: () => void;
  onPick: (day: number) => void;
};

/** 「‹ 다른 날로」 + day 목록 — 「day 3」 · 회색 날짜, 지금 날짜는 회색 「지금」 · 고를 수 없음 */
function DayList({ dayIndex, startDate, totalDays, onBack, onPick }: DayListProps) {
  return (
    <>
      <DropdownMenuItem
        closeOnClick={false}
        onClick={onBack}
        className="h-10 gap-1 px-1.5 text-[13px] font-bold text-ink-500 [&_svg]:size-4"
      >
        <ChevronLeft />
        다른 날로
      </DropdownMenuItem>
      {Array.from({ length: totalDays }, (_, d) => d).map((d) => {
        const { date, dow } = dayParts(startDate, d);
        const now = d === dayIndex;
        return (
          <DropdownMenuItem
            key={d}
            disabled={now}
            onClick={() => onPick(d)}
            className={cn(ROW, "gap-2 data-disabled:opacity-100")}
          >
            <span className={cn("font-bold", now ? "text-ink-350" : "text-ink-900")}>
              day {d + 1}
            </span>
            <span className="flex-1 text-[13px] font-normal text-ink-400">
              {date}/{dow}
            </span>
            {now && <span className="text-xs font-bold text-ink-350">지금</span>}
          </DropdownMenuItem>
        );
      })}
    </>
  );
}
