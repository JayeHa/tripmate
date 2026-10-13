"use client";

import { useMediaQuery } from "@/shared/lib/use-media-query";
import { Toast } from "@/shared/ui/toast";

import { useNotes } from "../model/use-notes";
import { MobileNotes } from "./mobile-notes";
import { PcNotes } from "./pc-notes";

type TripNotesViewProps = { tripId: string };

/**
 * 노트 — 체크리스트 · 바우처 · 준비물 · 쇼핑. 상태(탭 · 숫자 · 토스트)는 useNotes 가 쥐고, 배치는 모바일(탭 칩) · PC(왼쪽 메뉴)가 그린다.
 * 첫 렌더(하이드레이션)에서는 화면 폭을 몰라 아무 레이아웃도 그리지 않는다. 바우처 · 준비물 · 쇼핑은 아직 「준비 중」
 */
export function TripNotesView({ tripId }: TripNotesViewProps) {
  const notes = useNotes(tripId);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  if (isDesktop === null) return null;
  return (
    <>
      {isDesktop ? (
        <PcNotes tripId={tripId} notes={notes} />
      ) : (
        <MobileNotes tripId={tripId} notes={notes} />
      )}
      <Toast message={notes.toast} onDone={notes.clearToast} />
    </>
  );
}
