import { X } from "lucide-react";
import type { ReactNode } from "react";

import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";

type ScreenModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  /** 제목 아래 작은 글 — 여행 이름 */
  subtitle: string;
  children: ReactNode;
};

/**
 * PC 에서 모바일 화면을 그대로 띄우는 가운데 480×760 창(화면이 낮으면 화면 높이까지) — 카테고리 상세 · 정산.
 * 왼쪽 위 ✕ · 바깥 · Esc 로 닫는다. 내용은 창 안에서 세로로 스크롤한다
 */
export function ScreenModal({ open, onClose, title, subtitle, children }: ScreenModalProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[min(760px,calc(100dvh-2rem))] w-120 max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-120"
      >
        <header className="flex h-13 shrink-0 items-center gap-3.5 px-4.5">
          <button type="button" aria-label="닫기" onClick={onClose} className="flex text-ink-900">
            <X className="size-6" />
          </button>
          <div className="flex flex-col">
            <DialogTitle className="text-[17px] font-extrabold text-ink-900">{title}</DialogTitle>
            <span className="text-xs text-ink-400">{subtitle}</span>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto pb-10">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
