"use client";

import { X } from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";

type SheetDialogProps = {
  open: boolean;
  /** 닫기(✕ · 바깥 누르기 · Esc). 저장 중처럼 닫으면 안 될 때는 locked 로 막는다 */
  onClose: () => void;
  /** 머리 제목. 비우면 ✕ 만 보인다(읽기 프로그램용 제목은 ariaTitle) */
  title?: string;
  /** 제목을 보이지 않을 때 읽기 프로그램이 읽을 이름 */
  ariaTitle?: string;
  /** 요청이 서버에 가 있는 동안 — 닫지 못하게 */
  locked?: boolean;
  children: React.ReactNode;
};

/**
 * 다른 창(일정 상세) 위에 겹쳐 여는 작은 편집 창. 1024px 아래는 바텀시트(최대 85%), 이상은 가운데 480 모달.
 * 머리는 제목(18/800) + ✕, 바깥을 누르면 취소. 본문이 길면 안에서 스크롤한다
 */
export function SheetDialog({
  open,
  onClose,
  title,
  ariaTitle,
  locked = false,
  children,
}: SheetDialogProps) {
  return (
    <Dialog open={open} locked={locked} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton={false}
        // 일정 상세 안에서 여는 중첩 창이라 스크림을 직접 그려 뒤 창을 어둡게 한다
        forceOverlay
        className="top-auto bottom-0 left-0 flex max-h-[85dvh] w-full max-w-none translate-0 flex-col gap-0 overflow-hidden rounded-none rounded-t-sheet bg-white p-0 ring-0 sm:max-w-none lg:top-1/2 lg:bottom-auto lg:left-1/2 lg:max-h-[calc(100dvh-2rem)] lg:w-120 lg:max-w-120 lg:-translate-1/2 lg:rounded-sheet lg:shadow-sheet"
      >
        <div className="flex shrink-0 items-center gap-3 px-5 pt-5 pb-3.5">
          <DialogTitle className={title ? "flex-1 text-lg font-extrabold text-ink-900" : "sr-only"}>
            {title ?? ariaTitle}
          </DialogTitle>
          {!title && <span className="flex-1" />}
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            disabled={locked}
            className="flex text-ink-400 disabled:opacity-40"
          >
            <X className="size-5.5" strokeWidth={2} />
          </button>
        </div>
        {/* 안의 내용이 flex 로 줄어들지 않게 한 겹 감싼다 */}
        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-5 pb-[calc(1.75rem+env(safe-area-inset-bottom))]">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
