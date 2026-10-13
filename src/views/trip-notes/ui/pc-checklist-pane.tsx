"use client";

import { ListTodo } from "lucide-react";

import { ChecklistPanel, checklistTargetKey, useChecklistTargetItem } from "@/features/checklist";

import type { NotesState } from "../model/use-notes";

type PcChecklistPaneProps = { tripId: string; notes: NotesState };

/**
 * PC 체크리스트 오른쪽 칸 — 고른 항목의 읽기 · 편집 · 새 항목. 고른 것이 없거나 일행이 지웠으면 안내만.
 * 창이 아니라 칸이라 스크림 · 잠금이 없다(저장 중에는 ✕ 만 막는다)
 */
export function PcChecklistPane({ tripId, notes }: PcChecklistPaneProps) {
  const detail = notes.checklistDetail;
  const { item, visible } = useChecklistTargetItem(tripId, detail.target);
  return (
    <aside className="sticky top-(--shell-top) flex h-[calc(100dvh-var(--shell-top))] min-w-0 flex-1 flex-col border-l border-divider bg-white">
      {visible && detail.target ? (
        <ChecklistPanel
          key={checklistTargetKey(detail.target)}
          tripId={tripId}
          target={detail.target}
          item={item}
          onEdit={detail.edit}
          onClose={detail.close}
          onToast={notes.showToast}
        />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <ListTodo className="size-9 text-line-strong" aria-hidden="true" />
          <p className="text-sm text-ink-350">항목을 고르면 여기에 자세히 보여요</p>
        </div>
      )}
    </aside>
  );
}
