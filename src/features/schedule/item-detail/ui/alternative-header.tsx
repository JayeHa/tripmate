"use client";

import { ArrowLeft, ArrowLeftRight, Ellipsis, Trash2, X } from "lucide-react";
import { useState } from "react";

import { itemName, type ScheduleItem } from "@/entities/schedule-item";
import { DialogTitle } from "@/shared/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { IconButton } from "@/shared/ui/icon-button";

import { hasOwnRecord, type LinkedExpenses } from "../lib/alternatives";
import type { AlternativeActions } from "../model/use-alternative-actions";
import { RemoveAlternativeDialog } from "./remove-alternative-dialog";
import { SwapAlternativeDialog } from "./swap-alternative-dialog";

type AlternativeHeaderProps = {
  main: ScheduleItem;
  alt: ScheduleItem;
  /** 이 대체 장소 줄의 메모 수 — 빼기 전에 물을지 정한다 */
  memoCount: number;
  /** 이 대체 장소에 연결된 비용 — 빼기 전에 물을지 · 무엇을 알릴지 정한다 */
  linkedExpenses: LinkedExpenses;
  actions: AlternativeActions;
  /** 요청이 서버에 가 있는 동안 — 뒤로 · 닫기를 막는다 */
  locked: boolean;
  onBack: () => void;
  onClose: () => void;
};

/**
 * 대체 장소 상세의 머리 — ← 원래 일정 · 「대체 장소」 칩 + 제목(아이콘 + 이름) · 「○○의 대체 장소」 · ⋯(이 장소로 바꾸기 · 대체 장소에서 빼기) · 닫기.
 * 원래 일정의 ⋯(앞으로 · 뒤로 · 다른 날로 · 삭제)는 자리를 다루는 동작이라 여기에는 없다
 */
export function AlternativeHeader({
  main,
  alt,
  memoCount,
  linkedExpenses,
  actions,
  locked,
  onBack,
  onClose,
}: AlternativeHeaderProps) {
  const [confirming, setConfirming] = useState(false);
  const [swapping, setSwapping] = useState(false);
  return (
    <div className="flex shrink-0 items-center gap-3 bg-surface-sunken px-5 py-3.5">
      <button
        type="button"
        aria-label={`${itemName(main)}(으)로 돌아가기`}
        onClick={onBack}
        disabled={locked}
        className="flex text-ink-900 disabled:opacity-40"
      >
        <ArrowLeft className="size-5.5" strokeWidth={2} />
      </button>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-5.5 shrink-0 items-center rounded-full bg-primary-tint px-2 text-xs font-bold text-primary-pressed">
            대체 장소
          </span>
          <DialogTitle className="truncate text-lg font-extrabold tracking-[-0.01em] text-ink-900">
            {alt.emoji && <span className="mr-1.5 font-normal">{alt.emoji}</span>}
            {itemName(alt)}
          </DialogTitle>
        </div>
        <span className="truncate text-[13px] text-ink-400">{itemName(main)}의 대체 장소</span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <IconButton
              label="대체 장소 메뉴"
              className="p-1 text-ink-400 data-popup-open:bg-surface-muted"
            />
          }
        >
          <Ellipsis className="size-5.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem disabled={actions.pending} onClick={() => setSwapping(true)}>
            <ArrowLeftRight className="size-4.5 text-ink-700" />이 장소로 바꾸기
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            disabled={actions.pending}
            onClick={() =>
              hasOwnRecord(alt, memoCount, linkedExpenses.count)
                ? setConfirming(true)
                : actions.remove(alt)
            }
          >
            <Trash2 className="size-4.5" />
            대체 장소에서 빼기
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        disabled={locked}
        className="flex text-ink-400 disabled:opacity-40"
      >
        <X className="size-5.5" strokeWidth={2} />
      </button>
      <SwapAlternativeDialog
        open={swapping}
        onOpenChange={setSwapping}
        main={main}
        alt={alt}
        onConfirm={() => actions.swap(alt)}
      />
      <RemoveAlternativeDialog
        open={confirming}
        onOpenChange={setConfirming}
        onConfirm={() => actions.remove(alt)}
        expenses={linkedExpenses}
      />
    </div>
  );
}
