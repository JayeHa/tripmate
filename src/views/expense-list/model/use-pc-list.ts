"use client";

import { useState } from "react";

import { type ExpenseFilters, NO_FILTERS } from "../lib/filters";
import type { ExpenseSort } from "../lib/table-groups";

/** 금액 칸 보기 — 결제한 통화가 크게, 또는 기준 화폐로 환산한 금액이 크게 */
export type AmountMode = "local" | "home";

/** 기기별 저장값 키 — 「결제 통화 / 원화 환산」 */
const MODE_KEY = "tm-exp-cur-mode";

/** 저장된 금액 보기. 없거나 읽지 못하면(사생활 모드 · 막힌 저장소) 결제 통화 */
function readMode(): AmountMode {
  try {
    return localStorage.getItem(MODE_KEY) === "home" ? "home" : "local";
  } catch {
    return "local";
  }
}

/**
 * PC 가계부의 화면 상태 — 필터 · 정렬과 금액 보기(「결제 통화 / 원화 환산」). 필터 「초기화」 는 정렬을 그대로 둔다. 금액 보기는 기기마다 기억한다(일행과 나누지 않는 보기 설정).
 * PC 레이아웃은 화면 폭을 안 뒤에만 그려(클라이언트 전용) 첫 렌더에서 저장값을 읽어도 하이드레이션과 어긋나지 않는다
 */
export function usePcList() {
  const [filters, setFilters] = useState<ExpenseFilters>(NO_FILTERS);
  const [sort, setSort] = useState<ExpenseSort>("date");
  const [mode, setModeState] = useState<AmountMode>(readMode);

  /** 금액 보기를 바꾸고 기억한다. 저장하지 못해도 이 화면에서는 바뀐다 */
  function setMode(next: AmountMode) {
    setModeState(next);
    try {
      localStorage.setItem(MODE_KEY, next);
    } catch {
      // 저장소가 막혀 있다 — 이 화면에서만 기억한다
    }
  }

  /** 필터 하나를 바꾼다 */
  function patch(next: Partial<ExpenseFilters>) {
    setFilters((f) => ({ ...f, ...next }));
  }

  return { filters, patch, reset: () => setFilters(NO_FILTERS), sort, setSort, mode, setMode };
}

export type PcList = ReturnType<typeof usePcList>;
