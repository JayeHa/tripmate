"use client";

import { CalendarDays, ChevronDown, X } from "lucide-react";
import { useState } from "react";

import { useOpenCount } from "@/shared/lib/use-dialog-state";
import { cn } from "@/shared/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";

import { findLinkPick, type LinkPickGroup } from "../../lib/link-pick";
import { LinkPickBody } from "./link-pick-body";

type ScheduleLinkFieldProps = {
  /** 고른 줄 id. 없으면 null */
  value: string | null;
  /** 고르기 창에서 골랐다 — 「연결 안 함」 이면 null */
  onChange: (id: string | null) => void;
  /** 칸의 ✕. 없으면 onChange(null) */
  onClear?: () => void;
  groups: LinkPickGroup[];
  /** 날짜 필터의 처음 값(묶음 key). 고른 줄이 있으면 그 날이 먼저 */
  defaultDay?: string | null;
  /** 비었을 때 칸 글자 */
  placeholder?: string;
  /** 골랐을 때 ✕ 를 보일지 */
  clearable?: boolean;
};

/**
 * 일정 연결 칸(P34) — 비용 · 바우처 · 체크리스트가 어떤 일정에 붙는지 고른다.
 * 칸 44 · r10 · 달력 17 · 15/700 · ⌄ 16. 비면 1px 회색 테두리 + 회색 글자, 고르면 1.5px 잉크 테두리 + 「day 2 · 이름」 + ✕.
 * 누르면 PC(1024 이상) 가운데 480×640 창, 그 아래는 높이 92% 바텀시트에서 고른다. 고르면 바로 적용하고 닫힌다
 */
export function ScheduleLinkField({
  value,
  onChange,
  onClear,
  groups,
  defaultDay = null,
  placeholder = "일정 고르기",
  clearable = true,
}: ScheduleLinkFieldProps) {
  const [open, setOpen] = useState(false);
  const opens = useOpenCount(open);
  const picked = findLinkPick(groups, value);
  return (
    <>
      <div
        className={cn(
          "flex h-11 items-center rounded-memo bg-white",
          picked ? "border-[1.5px] border-ink-900" : "border border-input",
        )}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          className="flex h-full min-w-0 flex-1 items-center gap-2 pl-3 text-left"
        >
          <CalendarDays
            className={cn("size-4.25 shrink-0", picked ? "text-ink-900" : "text-ink-400")}
            aria-hidden="true"
          />
          <span
            className={cn(
              "flex-1 truncate text-[15px] font-bold",
              picked ? "text-ink-900" : "text-ink-400",
            )}
          >
            {picked ? `${picked.group.short} · ${picked.item.title}` : placeholder}
          </span>
          {!(picked && clearable) && (
            <ChevronDown className="mr-3 size-4 shrink-0 text-ink-450" aria-hidden="true" />
          )}
        </button>
        {picked && clearable && (
          <button
            type="button"
            aria-label="일정 연결 지우기"
            onClick={() => (onClear ? onClear() : onChange(null))}
            className="flex size-9 shrink-0 items-center justify-center text-ink-400"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          // 비용 입력 창 안에서 여는 중첩 창이라 스크림을 직접 그린다
          forceOverlay
          className="top-auto bottom-0 left-0 flex h-[92dvh] w-full max-w-none translate-0 flex-col gap-0 overflow-hidden rounded-none rounded-t-sheet bg-white p-0 ring-0 sm:max-w-none lg:top-1/2 lg:bottom-auto lg:left-1/2 lg:h-[min(640px,calc(100dvh-2rem))] lg:w-120 lg:max-w-120 lg:-translate-1/2 lg:rounded-sheet lg:shadow-sheet"
        >
          <div className="flex shrink-0 items-center gap-3 px-5 pt-5 pb-3">
            <DialogTitle className="flex-1 text-lg font-extrabold text-ink-900">
              일정 연결
            </DialogTitle>
            <button
              type="button"
              aria-label="닫기"
              onClick={() => setOpen(false)}
              className="flex text-ink-400"
            >
              <X className="size-5.5" strokeWidth={2} />
            </button>
          </div>
          {/* 열 때마다 검색 · 필터를 처음 값으로 — 닫히는 동안에는 그대로 둔다 */}
          <LinkPickBody
            key={opens}
            groups={groups}
            value={picked ? value : null}
            defaultDay={picked?.group.key ?? defaultDay}
            onPick={(id) => {
              onChange(id);
              setOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
