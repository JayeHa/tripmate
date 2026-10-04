import type { KeyboardEventHandler, PointerEventHandler } from "react";

import { cn } from "@/shared/lib/utils";

type SplitHandleProps = {
  /** 목록 너비와 범위. 스크린리더가 읽는다 */
  width: number;
  minWidth: number;
  maxWidth: number;
  onKeyDown: KeyboardEventHandler;
  dragging: boolean;
  /** useSplitWidth 의 dragHandlers. pointer capture 로 드래그 시작부터 끝까지 이 요소가 받는다 */
  dragHandlers: {
    onPointerDown: PointerEventHandler;
    onPointerMove: PointerEventHandler;
    onPointerUp: PointerEventHandler;
    onPointerCancel: PointerEventHandler;
    onLostPointerCapture: PointerEventHandler;
  };
  /** 더블클릭하면 기본 너비(440)로 */
  onReset: () => void;
};

/** 목록과 지도 사이 12px 경계선. 끌어서 너비를 바꾸고, 드래그 중엔 선이 파랗다 */
export function SplitHandle({
  width,
  minWidth,
  maxWidth,
  onKeyDown,
  dragging,
  dragHandlers,
  onReset,
}: SplitHandleProps) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="일정 목록 너비 (←/→ 로 조절, Enter 는 기본 너비)"
      aria-valuenow={width}
      aria-valuemin={minWidth}
      aria-valuemax={maxWidth}
      tabIndex={0}
      onKeyDown={onKeyDown}
      {...dragHandlers}
      onDoubleClick={onReset}
      className="group relative z-5 -mx-1.5 flex w-3 shrink-0 cursor-col-resize touch-none items-center justify-center outline-none"
    >
      <span
        // 드래그 중이거나 키보드로 포커스했을 때 파랗게
        className={cn(
          "absolute inset-y-0 left-1.5 w-px",
          dragging ? "bg-primary" : "bg-divider group-focus-visible:bg-primary",
        )}
      />
      <span className="relative h-10 w-1.5 rounded-[3px] border border-line-strong bg-white shadow-card" />
    </div>
  );
}
