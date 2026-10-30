"use client";

import { useState } from "react";

import type { Trip } from "@/entities/trip";
import { useTripExit } from "@/features/trip/exit";

import { type EditAction, editMenu } from "../lib/edit-menu";

/** 여행 홈 「편집」 — 지금 연 창 하나와 나가기 · 삭제 */
export function useTripEdit(trip: Trip) {
  const [open, setOpen] = useState<EditAction | null>(null);
  const exit = useTripExit(trip);

  /** 메뉴 줄을 골랐을 때 — 확인 창은 지난 오류 없이 연다 */
  function choose(action: EditAction) {
    exit.reset();
    setOpen(action);
  }

  return {
    menu: editMenu(exit.isOwner),
    open,
    choose,
    close: () => setOpen(null),
    leave: exit.leave,
    remove: exit.remove,
  };
}

export type TripEditState = ReturnType<typeof useTripEdit>;
