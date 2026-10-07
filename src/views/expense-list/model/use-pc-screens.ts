"use client";

import { useState } from "react";

import type { PersonKey } from "@/entities/expense";

import type { CategoryPick } from "../lib/category-detail";

/** 주소로 들어왔을 때 처음 열어 둘 PC 창 — /categories?c= 는 카테고리, /settlement?p= 는 정산(null 이면 나부터) */
export type PcScreensInitial = { category?: CategoryPick; settle?: PersonKey | null };

/**
 * PC 가계부의 가운데 창(카테고리 상세 · 정산) 상태. 오른쪽 패널은 줄을 고르면 사라졌다 다시 생기므로 그 위(목록)에 둔다 —
 * 패널에 두면 다시 생길 때 주소의 창이 또 열린다. 주소의 창은 이 목록이 마운트될 때 한 번 연다
 * (모바일 → PC 로 폭이 바뀌어 다시 마운트돼도 같은 주소면 같은 창이 열린다)
 */
export function usePcScreens(initial: PcScreensInitial = {}) {
  const [category, setCategory] = useState<CategoryPick | null>(initial.category ?? null);
  // undefined 면 닫힘, null 이면 나부터
  const [settle, setSettle] = useState<PersonKey | null | undefined>(initial.settle);
  return {
    category,
    settle,
    open: category !== null || settle !== undefined,
    openCategory: setCategory,
    closeCategory: () => setCategory(null),
    openSettle: (person: PersonKey | null) => setSettle(person),
    closeSettle: () => setSettle(undefined),
  };
}
