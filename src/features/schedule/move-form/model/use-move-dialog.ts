"use client";

import { useState } from "react";

import type { TimelineRow } from "@/entities/schedule-item";

import type { MovePair } from "../ui/move-dialog";

/**
 * 이동 방법 창의 열림 상태와 대상 쌍. 닫혀도 마지막 쌍을 들고 있어 닫히는 동안 내용이 남는다.
 * ready 가 false(이동 기록을 아직 못 불러옴 · 실패)면 openFor 를 주지 않는다 — 빈 창에서 저장하면 같은 쌍의
 * 기존 기록을 덮어쓰기 때문이다. 그대로 Timeline 의 onEditMove 로 넘긴다.
 */
export function useMoveDialog(ready: boolean) {
  const [pair, setPair] = useState<MovePair | null>(null);
  const [open, setOpen] = useState(false);

  /** 타임라인 줄의 직전 장소 쌍으로 창을 연다 */
  function openFor({ leg, item }: TimelineRow) {
    if (!leg) return;
    setPair({
      fromItemId: leg.fromItemId,
      fromName: leg.fromName,
      toItemId: item.id,
      toName: item.name,
      mode: leg.mode,
      detail: leg.detail,
      hasMove: leg.hasMove,
    });
    setOpen(true);
  }

  return { open, pair, openFor: ready ? openFor : undefined, close: () => setOpen(false) };
}
