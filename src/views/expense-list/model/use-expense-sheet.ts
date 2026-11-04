"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useRef } from "react";

import { type ExpenseSheet, SHEET_PARAM, sheetOfParam, sheetToParam } from "../lib/expense-sheet";

/** 지금 주소에서 검색값 하나만 바꾼 주소 — null 이면 뺀다 */
function urlWith(pathname: string, value: string | null): string {
  const params = new URLSearchParams(window.location.search);
  if (value === null) params.delete(SHEET_PARAM);
  else params.set(SHEET_PARAM, value);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

/**
 * 모바일 가계부 목록 위의 창(비용 추가 · 상세 · 수정) — 페이지로 옮기지 않아 목록이 그대로 남고, 닫으면 보던 자리다(2026-11-02 사용자 요청).
 * 창은 주소의 `?sheet=` 를 따른다 — 열 때 방문 기록을 하나 쌓아(pushState) 기기의 뒤로 가기 · 스와이프로 닫힌다.
 * 상세 ↔ 수정은 기록을 바꿔치기(replaceState)해 닫으면 한 번에 목록이다. ✕ · 저장으로 닫을 때 이 화면이 연 창이면 뒤로(back),
 * 새로고침 · 링크로 창이 열린 채 들어왔으면 검색값만 뺀다(뒤로 가면 앱 밖으로 나갈 수 있다)
 * @see https://nextjs.org/docs/app/getting-started/linking-and-navigating#native-history-api
 */
export function useExpenseSheet() {
  const pathname = usePathname();
  const sheet = sheetOfParam(useSearchParams().get(SHEET_PARAM));
  // 이 화면이 pushState 로 연 창인가 — 맞으면 닫기 = 뒤로
  const pushed = useRef(false);
  return {
    sheet,
    /** 창을 연다(기록 하나 쌓기) */
    open: (next: ExpenseSheet) => {
      window.history.pushState(null, "", urlWith(pathname, sheetToParam(next)));
      pushed.current = true;
    },
    /** 열린 창을 바꾼다(상세 ↔ 수정) */
    swap: (next: ExpenseSheet) => {
      window.history.replaceState(null, "", urlWith(pathname, sheetToParam(next)));
    },
    /** 창을 닫는다 */
    close: () => {
      if (pushed.current) {
        pushed.current = false;
        window.history.back();
        return;
      }
      window.history.replaceState(null, "", urlWith(pathname, null));
    },
  };
}

export type ExpenseSheetState = ReturnType<typeof useExpenseSheet>;
