"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { openCount, useChecklist } from "@/entities/checklist";
import { useChecklistDetail } from "@/features/checklist";
import type { ToastMessage } from "@/shared/ui/toast";

import { type NoteTab, parseNoteTab } from "../lib/tabs";

/**
 * 노트 화면의 상태 — 지금 탭(주소의 tab, 다른 화면에서 「노트에서 보기」 로 바로 열 수 있게) · 탭 숫자 · 토스트 ·
 * 열린 체크리스트 창(모바일 시트 · PC 오른쪽 칸이 같은 상태를 그린다).
 * 탭을 바꾸면 주소를 바꾸되 방문 기록은 쌓지 않는다
 */
export function useNotes(tripId: string) {
  const router = useRouter();
  const pathname = usePathname();
  const tab = parseNoteTab(useSearchParams().get("tab"));
  const { data: checklist } = useChecklist(tripId);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const checklistDetail = useChecklistDetail();
  return {
    tab,
    setTab: (next: NoteTab) => router.replace(`${pathname}?tab=${next}`, { scroll: false }),
    /** 탭 · 메뉴의 숫자 — 아직 없는 탭은 null */
    counts: {
      checklist: checklist ? String(openCount(checklist)) : null,
      voucher: null,
      pack: null,
      shop: null,
    } satisfies Record<NoteTab, string | null>,
    checklistDetail,
    toast,
    showToast: (text: string) => setToast({ text, id: Date.now() }),
    clearToast: () => setToast(null),
  };
}

export type NotesState = ReturnType<typeof useNotes>;
