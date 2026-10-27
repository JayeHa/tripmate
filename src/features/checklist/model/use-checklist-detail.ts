"use client";

import { useState } from "react";

/**
 * 열린 체크리스트 창 — 읽기(view) · 편집(edit) · 새 항목(new).
 * 새 항목의 at 은 열 때마다 달라서, 같은 제목으로 다시 열어도 폼이 처음 값에서 시작하게 key 로 쓴다
 */
export type ChecklistTarget =
  { mode: "view" | "edit"; id: string } | { mode: "new"; title: string; at: number };

/**
 * 노트 화면이 쥐는 체크리스트 창 상태 — 목록(행 누르기 · 「자세히」)이 열고, 모바일 시트 · PC 오른쪽 칸이 그린다.
 * 레이아웃이 바뀌어도(1024 넘나들기) 열린 항목이 이어지게 화면(view)에서 하나만 둔다.
 * initialId 가 있으면 그 항목의 읽기 화면을 연 채로 시작한다(다른 화면에서 「이 할 일 열기」 로 왔을 때)
 */
export function useChecklistDetail(initialId: string | null = null) {
  const [target, setTarget] = useState<ChecklistTarget | null>(() =>
    initialId ? { mode: "view", id: initialId } : null,
  );
  return {
    target,
    /** 행을 눌렀다 — 읽기 화면부터 */
    open: (id: string) => setTarget({ mode: "view", id }),
    /** 「자세히」 — 빠른 추가 바에 치던 제목을 가져가 새 항목 폼으로 */
    openNew: (title: string) => setTarget({ mode: "new", title, at: Date.now() }),
    /** 읽기 화면의 「편집」 */
    edit: (id: string) => setTarget({ mode: "edit", id }),
    close: () => setTarget(null),
  };
}

export type ChecklistDetailState = ReturnType<typeof useChecklistDetail>;
