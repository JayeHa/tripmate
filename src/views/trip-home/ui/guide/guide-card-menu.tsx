"use client";

import { Ellipsis, NotebookPen, Pencil, Trash2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

type GuideCardMenuProps = {
  name: string;
  hasMemo: boolean;
  /** 장소 정보 수정 — 만든 사람만. 아니면 null(줄을 숨긴다) */
  onEdit: (() => void) | null;
  onMemo: () => void;
  onRemove: () => void;
};

/** 카드 ⋯ — 장소 정보 수정(만든 사람만) · 메모 쓰기/고치기 · 보관함에서 빼기(빨강). 카드를 누른 것으로 번지지 않게 앞에 띄운다 */
export function GuideCardMenu({ name, hasMemo, onEdit, onMemo, onRemove }: GuideCardMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`${name} 메뉴`}
        className="relative -mt-1 -mr-2 flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink-400 hover:bg-surface-muted"
      >
        <Ellipsis className="size-4.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {onEdit && (
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="text-ink-700" />
            장소 정보 수정
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={onMemo}>
          <NotebookPen className="text-ink-700" />
          {hasMemo ? "메모 고치기" : "메모 쓰기"}
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={onRemove}>
          <Trash2 />
          보관함에서 빼기
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
