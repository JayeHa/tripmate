"use client";

import { useState } from "react";

import type { City } from "@/entities/city";
import type { Memo, Place, ScheduleItem, TimelineRow } from "@/entities/schedule-item";
import type { ToastMessage } from "@/shared/ui/toast";

/**
 * 일정 상세 · 카드에서 위에 여는 창들의 상태 — 장소 정보 수정 · 대체 장소 직접 추가 · 메모 작성 · 날짜 메모 · 토스트.
 * 화면(TripScheduleView)이 쥐고 DetailOverlays 가 그린다. 열 때 받은 값으로 창을 열고, 닫으면 null
 */
export function useDetailOverlays() {
  // 「장소 정보 수정」 으로 연 장소 입력 폼. 저장하면 닫고 상세 위에 토스트를 띄운다
  const [placeEdit, setPlaceEdit] = useState<{ place: Place; city: City | null } | null>(null);
  // 대체 장소 「+ 직접 추가」 로 연 장소 입력 폼(대체 장소 모드)
  const [altAdd, setAltAdd] = useState<{ main: ScheduleItem; city: City | null } | null>(null);
  // 메모 작성 · 수정 창. 상세의 「+ 메모」 · 메모 누르기
  const [memo, setMemo] = useState<{ row: TimelineRow; memo: Memo | null } | null>(null);
  // 날짜 메모 쓰기(날짜 끝 「메모 추가」) — 처음 고른 날 · 날짜 메모 고치기(메모 줄 누르기)
  const [dayMemo, setDayMemo] = useState<number | null>(null);
  const [note, setNote] = useState<ScheduleItem | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  return {
    placeEdit,
    altAdd,
    memo,
    dayMemo,
    note,
    toast,
    openPlaceEdit: (place: Place, city: City | null) => setPlaceEdit({ place, city }),
    openAltAdd: (main: ScheduleItem, city: City | null) => setAltAdd({ main, city }),
    openMemo: (row: TimelineRow, target: Memo | null) => setMemo({ row, memo: target }),
    closePlaceEdit: () => setPlaceEdit(null),
    closeAltAdd: () => setAltAdd(null),
    closeMemo: () => setMemo(null),
    openDayMemo: (dayIndex: number) => setDayMemo(dayIndex),
    closeDayMemo: () => setDayMemo(null),
    openNote: (item: ScheduleItem) => setNote(item),
    closeNote: () => setNote(null),
    /** detail 이 있으면 안내형(「제목 · 설명」, 조금 더 오래) */
    showToast: (text: string, detail?: string) => setToast({ text, detail, id: Date.now() }),
    clearToast: () => setToast(null),
  };
}

export type DetailOverlays = ReturnType<typeof useDetailOverlays>;
