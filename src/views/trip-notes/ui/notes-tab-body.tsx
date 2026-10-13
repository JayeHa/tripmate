"use client";

import { Construction } from "lucide-react";

import { ChecklistBoard } from "@/features/checklist";
import { EmptyState } from "@/shared/ui/empty-state";

import { NOTE_TAB_INFO } from "../lib/tabs";
import type { NotesState } from "../model/use-notes";

type NotesTabBodyProps = {
  tripId: string;
  notes: NotesState;
  /** 체크리스트 빠른 추가 바가 붙는 높이(sticky top) */
  stickyTop: string;
};

/** 지금 탭의 내용 — 체크리스트, 아직 만들지 않은 탭은 「준비 중」 */
export function NotesTabBody({ tripId, notes, stickyTop }: NotesTabBodyProps) {
  if (notes.tab === "checklist") {
    return <ChecklistBoard tripId={tripId} stickyTop={stickyTop} onToast={notes.showToast} />;
  }
  return (
    <EmptyState
      icon={Construction}
      title="준비 중이에요"
      description={`${NOTE_TAB_INFO[notes.tab].label} 탭은 곧 열려요. 체크리스트부터 먼저 쓸 수 있어요.`}
      className="py-20"
    />
  );
}
