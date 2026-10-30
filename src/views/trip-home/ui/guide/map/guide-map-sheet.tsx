"use client";

import { Map as MapIcon } from "lucide-react";

import { cn } from "@/shared/lib/utils";

import type { SheetStage } from "../../../lib/guide-map";

/** 단계 높이 — 접힘 64(핸들 + 제목 줄) · 반(지도 칸 절반, 최대 300) · 펼침(지도 칸 전체). lib 의 stageHeight 와 같은 값 */
const STAGE_HEIGHT: Record<SheetStage, string> = {
  peek: "h-16",
  half: "h-[min(300px,50%)]",
  full: "h-full",
};

type GuideMapSheetProps = {
  stage: SheetStage;
  /** 끄는 동안의 높이(px). null 이면 단계 높이 */
  dragHeight: number | null;
  onHandleDown: (e: React.PointerEvent) => void;
  onHandleTap: () => void;
  /** 「지도 보기」 — 반 단계로 */
  onShowMap: () => void;
  /** 바뀌면 스크롤을 맨 위로(목록 ↔ 상세 · 다른 장소) */
  scrollKey: string;
  children: React.ReactNode;
};

/**
 * 모바일 지도 시트 — 흰 · 위 r22(펼치면 0) · 위로 그림자. 맨 위 핸들(24, 바 36×4)을 끌거나 누른다.
 * 펼친 동안만 안쪽이 스크롤되고, 아래 가운데 잉크 「지도 보기」 로 반 단계로 내려간다.
 * 끄는 동안은 px 높이로 손가락을 바로 따라오고(애니메이션 없음), 놓으면 단계 높이로 0.25s 에 붙는다
 */
export function GuideMapSheet({
  stage,
  dragHeight,
  onHandleDown,
  onHandleTap,
  onShowMap,
  scrollKey,
  children,
}: GuideMapSheetProps) {
  const dragging = dragHeight !== null;
  const expanded = stage === "full" && !dragging;
  return (
    <>
      <div
        style={dragging ? { height: dragHeight } : undefined}
        className={cn(
          "absolute inset-x-0 bottom-0 z-10 flex flex-col overflow-hidden bg-white shadow-sheet",
          !dragging && STAGE_HEIGHT[stage],
          !dragging && "transition-[height] duration-250 ease-out",
          expanded ? "rounded-none" : "rounded-t-sheet",
        )}
      >
        <button
          type="button"
          aria-label="목록 높이 바꾸기"
          onPointerDown={onHandleDown}
          onClick={onHandleTap}
          className="flex h-6 shrink-0 cursor-grab touch-none items-center justify-center"
        >
          <span className="h-1 w-9 rounded-full bg-line-strong" />
        </button>
        <div
          key={scrollKey}
          className={cn("min-h-0 flex-1", expanded ? "overflow-y-auto" : "overflow-hidden")}
        >
          {children}
        </div>
      </div>
      {expanded && (
        <button
          type="button"
          onClick={onShowMap}
          className="absolute bottom-5 left-1/2 z-20 flex h-11 -translate-x-1/2 cursor-pointer items-center gap-1.5 rounded-sheet bg-ink-900 px-4.5 text-sm font-bold text-white shadow-[0_6px_18px_rgba(0,0,0,.25)]"
        >
          <MapIcon className="size-4" aria-hidden="true" />
          지도 보기
        </button>
      )}
    </>
  );
}
