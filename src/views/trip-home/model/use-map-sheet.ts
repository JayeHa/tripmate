"use client";

import type * as React from "react";
import { useRef, useState } from "react";

import {
  nearestStage,
  nextStage,
  PEEK_HEIGHT,
  type SheetStage,
  stageHeight,
} from "../lib/guide-map";

/** 이만큼 움직여야 끌기로 본다 — 그보다 작으면 누르기(핸들은 다음 단계, 줄은 그대로 눌림) */
const DRAG_SLOP = 4;

/**
 * 모바일 가이드 지도 시트 — 접힘 64 · 반(지도 칸 절반, 최대 300) · 펼침(지도 칸 전체) 세 단계.
 * 단계 높이는 CSS 가 정하고(GuideMapSheet), 끄는 동안만 px 높이(dragHeight)로 손가락을 따라간다.
 * 핸들 · 제목 줄 · 상세 머리를 끌다 놓으면 가장 가까운 단계로 붙는다. 핸들을 누르면 접힘 → 반 → 펼침 → 반.
 * 지도 칸 높이는 끌기를 시작할 때 `measure` 를 붙인 요소에서 잰다. 끌기 리스너는 누른 순간 창에 붙이고 놓을 때 뗀다
 */
export function useMapSheet() {
  const [stage, setStage] = useState<SheetStage>("half");
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const [box, setBox] = useState<HTMLElement | null>(null);
  // 마지막 누르기가 끌기였는지 — 끌고 놓은 뒤 따라오는 click 을 핸들 누르기로 치지 않게
  const movedRef = useRef(false);

  /** 끌기 시작 — 끌 수 있는 곳(핸들 · 제목 줄 · 상세 머리)의 onPointerDown */
  function startDrag(e: React.PointerEvent) {
    const mapHeight = box?.clientHeight ?? 0;
    if (mapHeight === 0) return;
    const y0 = e.clientY;
    const h0 = stageHeight(stage, mapHeight);
    movedRef.current = false;
    const heightAt = (y: number) => Math.max(PEEK_HEIGHT, Math.min(mapHeight, h0 + (y0 - y)));
    const move = (ev: PointerEvent) => {
      if (Math.abs(y0 - ev.clientY) > DRAG_SLOP) movedRef.current = true;
      if (movedRef.current) setDragHeight(heightAt(ev.clientY));
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      if (!movedRef.current) return;
      setDragHeight(null);
      setStage(nearestStage(heightAt(ev.clientY), mapHeight));
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  }

  /** 핸들 누르기 — 방금 끌었으면 무시한다 */
  function tapHandle() {
    if (movedRef.current) {
      movedRef.current = false;
      return;
    }
    setStage(nextStage);
  }

  return {
    stage,
    setStage,
    /** 끄는 동안의 높이(px). 놓으면 null — 단계 높이는 CSS */
    dragHeight,
    measure: setBox,
    startDrag,
    tapHandle,
  };
}
