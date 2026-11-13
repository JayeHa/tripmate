"use client";

import { useState } from "react";

import { useHeldWhileClosing, useOpenCount } from "@/shared/lib/use-dialog-state";
import { Dialog, DialogContent } from "@/shared/ui/dialog";

import {
  type RecordCrewProps,
  type RecordDraft,
  RecordForm,
  type RecordTarget,
} from "./record-form";

type RecordDialogProps = RecordCrewProps & {
  tripId: string;
  /** 연 장소. null 이면 닫힌다 */
  target: RecordTarget | null;
  onClose: () => void;
  onSave: (itemId: string, draft: RecordDraft) => void;
};

/**
 * 기록 창 — 모바일 바텀시트(최대 88%) · PC 가운데 480 모달. 본문은 별점 → 기록 글(200자) → 사진(10장 · 사진별 설명) 순서이고
 * 하단에 「취소」 · 「저장」. 취소 · 바깥 누르기는 바꾼 것을 버린다(별점도 저장할 때만 반영). 열 때마다 지금 값에서 다시 시작한다.
 * 별점 · 글은 오프라인 대기열로 올라간다. 사진을 바꿨으면 먼저 올리고(그동안 창을 닫지 못한다), 실패하면 창에 문구를 두고 다시 저장하게 한다.
 * 별점은 각자, 글 · 사진은 일행과 함께 쓴다 — 일행이 있으면 라벨에 그 덧말을 단다
 */
export function RecordDialog({ tripId, target, onClose, onSave, ...crew }: RecordDialogProps) {
  const open = target !== null;
  const shown = useHeldWhileClosing(open, target);
  const openCount = useOpenCount(open);
  const [locked, setLocked] = useState(false);
  return (
    <Dialog open={open} locked={locked} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="top-auto bottom-0 left-0 flex max-h-[88dvh] w-full max-w-none translate-0 flex-col gap-0 overflow-hidden rounded-none rounded-t-sheet bg-white p-0 ring-0 sm:max-w-none lg:top-1/2 lg:bottom-auto lg:left-1/2 lg:max-h-[calc(100dvh-80px)] lg:w-120 lg:max-w-120 lg:-translate-1/2 lg:rounded-[16px] lg:shadow-[0_12px_40px_rgba(0,0,0,.2)]"
      >
        {shown && (
          <RecordForm
            key={openCount}
            tripId={tripId}
            target={shown}
            {...crew}
            onLockChange={setLocked}
            onClose={onClose}
            onSave={(draft) => {
              onSave(shown.itemId, draft);
              onClose();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
