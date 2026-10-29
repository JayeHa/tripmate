"use client";

import { DragDropProvider } from "@dnd-kit/react";
import { isSortable, useSortable } from "@dnd-kit/react/sortable";
import { GripVertical } from "lucide-react";

import { DRAG_ROLE } from "@/shared/lib/drag-announcements";
import { cn } from "@/shared/lib/utils";
import { koreanPlugins } from "@/shared/ui/korean-drag-plugins";
import { Switch } from "@/shared/ui/switch";

import type { WidgetEditRow } from "../../lib/widget-prefs";
import type { WidgetKey } from "../../lib/widgets";
import { WIDGET_ICON } from "../summary/widget-row";

type WidgetEditListProps = {
  rows: WidgetEditRow[];
  onMove: (from: number, to: number) => void;
  onToggle: (key: WidgetKey) => void;
};

/**
 * 「홈 위젯 편집」 줄 목록 — 손잡이로 끌어 순서를 바꾸고(터치는 길게 눌러서, 키보드는 손잡이에서 스페이스), 스위치로 보이기를 바꾼다.
 * 끌기 · 자동 스크롤 · 화면 읽기 안내는 @dnd-kit/react 가 맡고, 놓으면 초안 순서를 바꾼다
 */
export function WidgetEditList({ rows, onMove, onToggle }: WidgetEditListProps) {
  return (
    <div className="flex flex-col border-t border-surface-muted">
      <DragDropProvider
        plugins={koreanPlugins}
        onDragEnd={(event) => {
          const { source } = event.operation;
          if (event.canceled || !isSortable(source)) return;
          onMove(source.initialIndex, source.index);
        }}
      >
        {rows.map((row, index) => (
          <WidgetEditItem
            key={row.key}
            row={row}
            index={index}
            onToggle={() => onToggle(row.key)}
          />
        ))}
      </DragDropProvider>
    </div>
  );
}

type WidgetEditItemProps = { row: WidgetEditRow; index: number; onToggle: () => void };

/** 한 줄(68) — 손잡이 · 아이콘 칸 36 · 이름 15/700 · 설명 12 · 스위치 */
function WidgetEditItem({ row, index, onToggle }: WidgetEditItemProps) {
  const { ref, handleRef, isDragging } = useSortable({
    id: row.key,
    index,
    data: { name: row.name },
  });
  const Icon = WIDGET_ICON[row.key];
  return (
    <div
      ref={ref}
      className={cn(
        "relative flex h-17 items-center gap-3 border-b border-surface-muted bg-white pr-5 pl-3",
        isDragging && "z-10 shadow-[0_10px_24px_rgba(0,0,0,0.16)]",
      )}
    >
      <button
        ref={handleRef}
        type="button"
        aria-label={`${row.name} 순서 옮기기`}
        aria-roledescription={DRAG_ROLE}
        className="flex size-6 shrink-0 cursor-grab touch-none items-center justify-center text-handle active:cursor-grabbing"
      >
        <GripVertical className="size-4.5" aria-hidden="true" />
      </button>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-memo bg-surface-sunken">
        <Icon className="size-4.5 text-ink-700" aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[15px] font-bold text-ink-900">{row.name}</span>
        <span className="truncate text-xs text-ink-400">{row.sub}</span>
      </span>
      <Switch
        checked={row.on}
        disabled={row.disabled}
        onCheckedChange={onToggle}
        aria-label={`${row.name} 보이기`}
      />
    </div>
  );
}
