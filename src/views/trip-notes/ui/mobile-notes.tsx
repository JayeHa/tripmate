"use client";

import { Plus } from "lucide-react";

import { ChecklistSheet } from "@/features/checklist";
import { cn } from "@/shared/lib/utils";
import { FilterChip } from "@/shared/ui/filter-chip";
import { floatingAddClass } from "@/shared/ui/floating-add-button";

import { NOTE_TAB_INFO, NOTE_TABS } from "../lib/tabs";
import type { NotesState } from "../model/use-notes";
import { MobileVoucherDetail } from "./mobile-voucher-detail";
import { NotesTabBody } from "./notes-tab-body";

type MobileNotesProps = { tripId: string; notes: NotesState };

/**
 * 모바일 노트 — 위에 붙은 머리(「노트」 · 탭 칩 줄, 넘치면 가로 스크롤) + 회색 바탕의 탭 내용.
 * 머리 높이(제목 52 + 탭 48 = 100)만큼 아래에 체크리스트 빠른 추가 바가 붙는다. 체크리스트 항목은 바텀시트로 연다.
 * 바우처 탭은 오른쪽 아래 플로팅 「+ 바우처」, 줄을 누르면 전체 화면 상세
 */
export function MobileNotes({ tripId, notes }: MobileNotesProps) {
  return (
    <main className="flex flex-1 flex-col bg-surface-sunken">
      <header className="sticky top-(--shell-top) z-20 flex flex-col bg-white">
        <h1 className="flex h-13 items-center px-5 text-xl font-extrabold tracking-[-0.02em] text-ink-900">
          노트
        </h1>
        <nav
          aria-label="노트 탭"
          className="flex scrollbar-none gap-1.5 overflow-x-auto border-b border-surface-muted px-5 pb-3"
        >
          {NOTE_TABS.map((t) => (
            <FilterChip
              key={t}
              size="lg"
              selected={notes.tab === t}
              onClick={() => notes.setTab(t)}
              className="px-3 text-sm"
            >
              {NOTE_TAB_INFO[t].label}
              {notes.counts[t] !== null && (
                <span className="text-xs opacity-75">{notes.counts[t]}</span>
              )}
            </FilterChip>
          ))}
        </nav>
      </header>
      <NotesTabBody
        tripId={tripId}
        notes={notes}
        stickyTop="top-[calc(var(--shell-top)+6.25rem)]"
      />
      <ChecklistSheet tripId={tripId} detail={notes.checklistDetail} onToast={notes.showToast} />
      <MobileVoucherDetail
        tripId={tripId}
        id={notes.voucherDetail.id}
        onClose={notes.voucherDetail.close}
        onEdit={notes.voucherForm.openEdit}
        onToast={notes.showToast}
      />
      {notes.tab === "voucher" && (
        <button
          type="button"
          onClick={notes.voucherForm.openNew}
          className={cn(
            "fixed right-4 bottom-[calc(99px+env(safe-area-inset-bottom))] z-20",
            floatingAddClass(false),
          )}
        >
          <Plus className="size-5" strokeWidth={2.4} aria-hidden="true" />
          <span className="text-[15px] font-extrabold">바우처</span>
        </button>
      )}
    </main>
  );
}
