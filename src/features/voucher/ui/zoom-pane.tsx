"use client";

import { useState } from "react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";

import { cn } from "@/shared/lib/utils";

/** 최대 확대 — 그림은 폭 1600px 로 그려 두어 휴대폰 폭(약 400pt)의 4배까지 글자가 읽힌다 */
const MAX_SCALE = 4;
/** 두 번 눌렀을 때 더하는 배율 — 1 → 2.5 */
const DOUBLE_TAP_STEP = 1.5;

type ZoomPaneProps = {
  children: React.ReactNode;
  /** 감싸는 칸 — 크기는 부모를 채운다(size-full) */
  className?: string;
  /** 확대했는지가 바뀔 때 — 넘겨 보기처럼 한 손가락 동작을 쓰는 쪽이 확대 중에는 비킨다 */
  onZoomChange?: (zoomed: boolean) => void;
};

/**
 * 두 손가락으로 확대하는 칸 — 바우처 그림 · PDF 쪽. 확대한 동안만 한 손가락으로 끌어 움직이고(칸 밖으로는 안 나간다),
 * 원래 크기에서는 한 손가락 동작을 막지 않아 세로 스크롤 · 좌우 넘기기가 그대로다.
 * 두 번 누르면 2.5배, 확대 중에 두 번 누르면 원래대로. PC 는 두 번 클릭 · 트랙패드 오므리기(⌃ 휠)로, 그냥 휠은 스크롤에 둔다.
 * react-zoom-pan-pinch 는 이 파일에서만 쓴다
 * @see https://github.com/BetterTyped/react-zoom-pan-pinch
 */
export function ZoomPane({ children, className, onZoomChange }: ZoomPaneProps) {
  const [zoomed, setZoomed] = useState(false);

  /** 배율이 바뀔 때마다 불린다 — 확대 여부가 바뀐 때만 알린다 */
  function track(scale: number) {
    const next = scale > 1.01;
    if (next === zoomed) return;
    setZoomed(next);
    onZoomChange?.(next);
  }

  return (
    <TransformWrapper
      minScale={1}
      maxScale={MAX_SCALE}
      panning={{ disabled: !zoomed, velocityDisabled: true }}
      wheel={{ activationKeys: ["Control", "Meta"] }}
      trackPadPanning={{ disabled: true }}
      doubleClick={{ mode: zoomed ? "reset" : "zoomIn", step: DOUBLE_TAP_STEP }}
      onTransform={(_, state) => track(state.scale)}
    >
      <TransformComponent wrapperClass={cn("size-full!", className)} contentClass="size-full!">
        {children}
      </TransformComponent>
    </TransformWrapper>
  );
}
