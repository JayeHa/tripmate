import type { PointerEvent } from "react";

import { cn } from "@/shared/lib/utils";

type SplitHandleProps = {
  dragging: boolean;
  onPointerDown: (e: PointerEvent) => void;
  /** 더블클릭하면 기본 너비(440)로 */
  onReset: () => void;
};

/** 목록과 지도 사이 12px 경계선. 끌어서 너비를 바꾸고, 드래그 중엔 선이 파랗다 */
export function SplitHandle({ dragging, onPointerDown, onReset }: SplitHandleProps) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="일정 · 지도 너비 조절 (더블클릭하면 기본 너비)"
      onPointerDown={onPointerDown}
      onDoubleClick={onReset}
      className="relative z-5 -mx-1.5 flex w-3 shrink-0 cursor-col-resize touch-none items-center justify-center"
    >
      <span
        className={cn("absolute inset-y-0 left-1.5 w-px", dragging ? "bg-primary" : "bg-divider")}
      />
      <span className="relative h-10 w-1.5 rounded-[3px] border border-line-strong bg-white shadow-card" />
    </div>
  );
}
