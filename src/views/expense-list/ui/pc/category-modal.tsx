"use client";

import { X } from "lucide-react";
import { useState } from "react";

import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";

import type { CategoryPick } from "../../lib/category-detail";
import type { ExpenseList } from "../../model/use-expense-list";
import { CategoryDetail } from "../category/category-detail";

type CategoryModalProps = {
  list: ExpenseList;
  /** 열 때 고른 카테고리. null 이면 닫혀 있다 */
  opened: CategoryPick | null;
  onClose: () => void;
};

/**
 * PC 카테고리 상세 — 모바일 화면을 그대로 가운데 480×760 창(화면이 낮으면 화면 높이까지)으로. 왼쪽 위 ✕ · 바깥 · Esc 로 닫는다.
 * 창 안에서 칩으로 바꾼 카테고리는 창을 닫으면 잊는다(다음에 열면 누른 카테고리부터)
 */
export function CategoryModal({ list, opened, onClose }: CategoryModalProps) {
  // 닫히는 동안(페이드 아웃)에도 내용을 그리도록 마지막으로 연 것을 붙잡아 둔다
  const [shown, setShown] = useState(opened);
  const [pick, setPick] = useState<CategoryPick>(opened ?? "all");
  if (opened !== null && opened !== shown) {
    setShown(opened);
    setPick(opened);
  }
  return (
    <Dialog open={opened !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[min(760px,calc(100dvh-2rem))] w-120 max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-120"
      >
        <header className="flex h-13 shrink-0 items-center gap-3.5 px-4.5">
          <button type="button" aria-label="닫기" onClick={onClose} className="flex text-ink-900">
            <X className="size-6" />
          </button>
          <div className="flex flex-col">
            <DialogTitle className="text-[17px] font-extrabold text-ink-900">카테고리</DialogTitle>
            <span className="text-xs text-ink-400">{list.trip.title}</span>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto pb-10">
          {shown !== null && <CategoryDetail list={list} pick={pick} onPick={setPick} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
