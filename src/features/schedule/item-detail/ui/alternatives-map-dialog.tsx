"use client";

import { X } from "lucide-react";
import type { ComponentProps } from "react";

import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/shared/ui/dialog";

import { AlternativesMap } from "./alternatives-map";

type AlternativesMapDialogProps = {
  open: boolean;
  onClose: () => void;
  /** 지금 일정 이름 — 제목 아래 */
  mainName: string;
  /** 미니 지도와 같은 값(고른 핀도 함께 쓴다). 크게 보기 · 앞뒤 일정은 이 창이 정한다 */
  map: Omit<ComponentProps<typeof AlternativesMap>, "expanded" | "onExpand">;
};

/**
 * 대체 장소 지도 크게 보기 — 모바일은 전체 화면, PC 는 가운데 큰 창. 위에 제목 · ✕, 아래는 지도가 꽉 찬다.
 * 한 손가락으로 움직이고 두 손가락으로 확대한다. 같은 날 앞뒤 일정 핀이 함께 보여 동선에 맞는 후보를 고르기 쉽다.
 * 상세 창 위에 겹쳐 열리는 창이라 스크림을 직접 그린다(forceOverlay)
 */
export function AlternativesMapDialog({
  open,
  onClose,
  mainName,
  map,
}: AlternativesMapDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        forceOverlay
        showCloseButton={false}
        className="inset-0 flex h-dvh w-full max-w-none translate-0 flex-col gap-0 overflow-hidden rounded-none p-0 sm:max-w-none lg:inset-auto lg:top-1/2 lg:left-1/2 lg:h-[min(760px,calc(100dvh-4rem))] lg:w-[min(1000px,calc(100vw-4rem))] lg:max-w-none lg:-translate-1/2 lg:rounded-sheet"
      >
        <div className="flex items-center gap-2 border-b border-divider px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-3">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <DialogTitle className="text-[17px] font-extrabold text-ink-900">
              대체 장소 지도
            </DialogTitle>
            <p className="truncate text-[13px] text-ink-500">{mainName} 대신 갈 곳</p>
          </div>
          <DialogClose
            aria-label="닫기"
            className="flex size-9 shrink-0 items-center justify-center text-ink-500"
          >
            <X className="size-5.5" />
          </DialogClose>
        </div>
        <div className="min-h-0 flex-1">
          <AlternativesMap {...map} expanded />
        </div>
      </DialogContent>
    </Dialog>
  );
}
