"use client";

import { useState } from "react";

import { useHeldWhileClosing } from "@/shared/lib/use-dialog-state";
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";

import type { ChecklistDetailState } from "../model/use-checklist-detail";
import { ChecklistPanel, checklistTargetKey, useChecklistTargetItem } from "./checklist-panel";

type ChecklistSheetProps = {
  tripId: string;
  detail: ChecklistDetailState;
  onToast: (text: string) => void;
};

/**
 * 모바일 체크리스트 창 — 아래에서 올라오는 시트(r22 · 최대 88%). 읽기 · 편집 · 새 항목을 같은 시트에서 바꿔 그린다.
 * 닫히는 동안에는 마지막 내용을 그대로 그린다. 저장 · 삭제 중에는 닫히지 않는다
 */
export function ChecklistSheet({ tripId, detail, onToast }: ChecklistSheetProps) {
  const [locked, setLocked] = useState(false);
  const { item, visible } = useChecklistTargetItem(tripId, detail.target);
  // 대상 · 항목을 따로 잡는다 — 둘 다 상태 · 쿼리의 같은 참조라 렌더마다 바뀌지 않는다
  const target = useHeldWhileClosing(visible, detail.target);
  const shownItem = useHeldWhileClosing(visible, item);
  return (
    <Dialog open={visible} locked={locked} onOpenChange={(open) => !open && detail.close()}>
      <DialogContent
        showCloseButton={false}
        className="top-auto bottom-0 left-0 flex max-h-[88dvh] w-full max-w-none translate-0 flex-col gap-0 overflow-hidden rounded-none rounded-t-sheet bg-white p-0 ring-0 sm:max-w-none"
      >
        {target && (
          <ChecklistPanel
            key={checklistTargetKey(target)}
            tripId={tripId}
            target={target}
            item={shownItem}
            onEdit={detail.edit}
            onClose={detail.close}
            onToast={onToast}
            onLockChange={setLocked}
            titleAs={DialogTitle}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
