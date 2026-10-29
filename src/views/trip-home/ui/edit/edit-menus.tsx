"use client";

import { CalendarDays, LogOut, type LucideIcon, PenLine, Trash2, UserPlus } from "lucide-react";
import { useState } from "react";

import { cn } from "@/shared/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "@/shared/ui/sheet";

import { EDIT_LABEL, type EditAction } from "../../lib/edit-menu";

/** 빨간 줄 — 되돌릴 수 없는 동작 */
const DANGER: ReadonlySet<EditAction> = new Set(["leave", "delete"]);

/** PC 드롭다운의 줄 아이콘 */
const ICON: Record<EditAction, LucideIcon> = {
  title: PenLine,
  dates: CalendarDays,
  invite: UserPlus,
  leave: LogOut,
  delete: Trash2,
};

type EditMenuProps = {
  menu: EditAction[];
  onChoose: (action: EditAction) => void;
  /** 「편집」 글자 크기 · 색 */
  className: string;
};

/**
 * 모바일 「편집」 — 바텀시트 메뉴. 위에 「편집」 14/700 #666, 줄 56 · 17/500, 나가기 · 삭제는 빨강.
 * 고르면 시트를 닫고 그 창을 연다
 */
export function MobileEditMenu({ menu, onChoose, className }: EditMenuProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        편집
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="gap-0 rounded-t-sheet px-0 pt-5.5 pb-[calc(30px+env(safe-area-inset-bottom))]"
        >
          <SheetTitle className="px-6 pb-2 text-sm font-bold text-ink-500">편집</SheetTitle>
          {menu.map((action) => (
            <button
              key={action}
              type="button"
              onClick={() => {
                setOpen(false);
                onChoose(action);
              }}
              className={cn(
                "flex h-14 items-center px-6 text-left text-[17px] font-medium active:bg-surface-sunken",
                DANGER.has(action) ? "text-destructive" : "text-ink-900",
              )}
            >
              {EDIT_LABEL[action]}
            </button>
          ))}
        </SheetContent>
      </Sheet>
    </>
  );
}

/** PC 「편집」 — 아래로 여는 드롭다운. 다른 PC 메뉴(⋯)와 같은 줄 모양 */
export function PcEditMenu({ menu, onChoose, className }: EditMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<button type="button" className={cn("data-popup-open:text-ink-900", className)} />}
      >
        편집
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-50">
        {menu.map((action) => {
          const Icon = ICON[action];
          const danger = DANGER.has(action);
          return (
            <DropdownMenuItem
              key={action}
              variant={danger ? "destructive" : "default"}
              onClick={() => onChoose(action)}
            >
              <Icon className={cn("size-4", !danger && "text-ink-700")} />
              {EDIT_LABEL[action]}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
