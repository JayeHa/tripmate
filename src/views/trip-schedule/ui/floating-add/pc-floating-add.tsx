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
 * PC 플로팅 「+ 추가」 — 일정 목록 칸 오른쪽 아래(20 · 20, 지도 위로는 올리지 않는다). 누르면 위로 200 메뉴.
 * 목록 칸의 relative 감싸개 안에 둔다
 */
export function PcFloatingAdd(props: FloatingAddProps) {
  const [open, setOpen] = useState(false);
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger className={cn("absolute right-5 bottom-5 z-10", floatingAddClass(open))}>
        <FloatingAddFace open={open} />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="end"
        sideOffset={16}
        className="w-50 rounded-[14px] border border-divider bg-white p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.16)] ring-0"
      >
        {floatingActions(props).map(({ key, label, Icon, tone, run }) => (
          <DropdownMenuItem
            key={key}
            disabled={!run}
            onClick={run}
            className="h-11 gap-2.5 rounded-memo px-3 text-[15px] font-bold text-ink-900 focus:bg-surface-sunken"
          >
            <Icon className={cn("size-4.5", tone)} />
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
