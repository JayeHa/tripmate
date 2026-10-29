"use client";

import { DragDropProvider } from "@dnd-kit/react";
import { isSortable } from "@dnd-kit/react/sortable";

import { koreanPlugins } from "@/shared/ui/korean-drag-plugins";

import { isSelectable } from "../lib/edit-draft";
import type { ScheduleEditState } from "../model/use-schedule-edit";
import { EditRow } from "./edit-row";

type EditListProps = { edit: ScheduleEditState; layout: "mobile" | "pc" };

/**
 * 그날 편집 목록. 끌기 · 놓을 자리 · 자동 스크롤 · 키보드는 @dnd-kit/react 가 맡고, 놓으면 초안 순서를 바꾼다
 * (쓰는 곳 · 바꿀 때 함께 볼 곳은 docs/engineering/library-policy.md)
 */
export function EditList({ edit, layout }: EditListProps) {
  return (
    <DragDropProvider
      plugins={koreanPlugins}
      onDragEnd={(event) => {
        const { source } = event.operation;
        if (event.canceled || !isSortable(source)) return;
        edit.reorder(source.initialIndex, source.index);
      }}
    >
      {edit.rows.map((row, index) => (
        <EditRow
          key={row.item.id}
          row={row}
          index={index}
          selected={edit.selected.has(row.item.id)}
          selectable={isSelectable(row.item)}
          onToggle={() => edit.toggle(row.item)}
          layout={layout}
        />
      ))}
    </DragDropProvider>
  );
}
