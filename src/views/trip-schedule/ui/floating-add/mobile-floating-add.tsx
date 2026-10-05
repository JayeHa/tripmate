"use client";

import { useState } from "react";

import { cn } from "@/shared/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

import {
  floatingActions,
  floatingAddClass,
  FloatingAddFace,
  type FloatingAddProps,
} from "./floating-add-actions";

/**
 * 모바일 플로팅 「+ 추가」 — 하단 탭 위 오른쪽(16 · 탭바 위 16). 누르면 스크림 위에 흰 pill 세 개가 버튼 위로 쌓인다.
 * 바깥(스크림)을 누르거나 Esc 면 닫힌다
 */
export function MobileFloatingAdd(props: FloatingAddProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {open && <div aria-hidden="true" className="fixed inset-0 z-30 bg-scrim" />}
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger
          className={cn(
            "fixed right-4 bottom-[calc(99px+env(safe-area-inset-bottom))] z-40",
            floatingAddClass(open),
          )}
        >
          <FloatingAddFace open={open} />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="top"
          align="end"
          sideOffset={12}
          className="flex w-auto min-w-0 flex-col items-end gap-2.5 overflow-visible bg-transparent p-0 shadow-none ring-0"
        >
          {floatingActions(props).map(({ key, label, Icon, tone, run }) => (
            <DropdownMenuItem
              key={key}
              onClick={run}
              className="flex h-11 gap-2 rounded-full bg-white pr-4 pl-3 text-[15px] font-bold text-ink-900 shadow-[0_4px_14px_rgba(0,0,0,0.16)] focus:bg-surface-sunken"
            >
              <Icon className={cn("size-4.5", tone)} />
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
