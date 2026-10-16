"use client";

import { Plus, Ticket } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { EmptyState } from "@/shared/ui/empty-state";

import { NOTE_TAB_INFO, NOTE_TABS } from "../lib/tabs";
import type { NotesState } from "../model/use-notes";
import { NotesTabBody } from "./notes-tab-body";
import { PcChecklistPane } from "./pc-checklist-pane";

type PcNotesProps = { tripId: string; notes: NotesState };

/**
 * PC 노트 — 왼쪽 220 세로 메뉴(아이콘 · 이름 · 숫자) + 본문. 체크리스트는 목록 400 + 오른쪽 상세 칸(고른 항목의 읽기 · 편집),
 * 바우처는 목록 440 + 오른쪽 상세 칸
 */
export function PcNotes({ tripId, notes }: PcNotesProps) {
  return (
    <main className="flex flex-1 bg-surface-sunken">
      <nav
        aria-label="노트 메뉴"
        className="sticky top-(--shell-top) flex h-[calc(100dvh-var(--shell-top))] w-55 shrink-0 flex-col gap-1 border-r border-divider bg-white px-3 py-5"
      >
        <span className="px-3 pb-2.5 text-[13px] font-bold text-ink-400">노트</span>
        {NOTE_TABS.map((t) => (
          <MenuItem
            key={t}
            tab={t}
            count={notes.counts[t]}
            active={notes.tab === t}
            onClick={() => notes.setTab(t)}
          />
        ))}
      </nav>
      <div className="flex min-w-0 flex-1">
        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col",
            notes.tab === "checklist" && "w-100 flex-none",
            notes.tab === "voucher" && "w-110 flex-none border-r border-divider",
          )}
        >
          <NotesTabBody
            tripId={tripId}
            notes={notes}
            stickyTop="top-(--shell-top)"
            voucherAction={
              <button
                type="button"
                onClick={notes.voucherForm.openNew}
                className="flex h-8.5 items-center gap-1 rounded-full bg-brand pr-3.5 pl-2.5 text-[13px] font-bold text-white"
              >
                <Plus className="size-3.75" strokeWidth={2.4} aria-hidden="true" />
                바우처
              </button>
            }
          />
        </div>
        {notes.tab === "checklist" && <PcChecklistPane tripId={tripId} notes={notes} />}
        {notes.tab === "voucher" && (
          <div className="min-w-0 flex-1 bg-white">
            <EmptyState
              icon={Ticket}
              title="바우처를 고르면 여기에 자세히 보여요"
              className="sticky top-(--shell-top) py-40"
            />
          </div>
        )}
      </div>
    </main>
  );
}

type MenuItemProps = {
  tab: (typeof NOTE_TABS)[number];
  count: string | null;
  active: boolean;
  onClick: () => void;
};

/** 메뉴 한 줄 — 48 · r10, 고른 것은 회색 바탕 · 굵게 */
function MenuItem({ tab, count, active, onClick }: MenuItemProps) {
  const { label, Icon } = NOTE_TAB_INFO[tab];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-12 items-center gap-2.5 rounded-memo px-3 text-left text-[15px]",
        active
          ? "bg-surface-muted font-extrabold text-ink-900"
          : "font-semibold text-ink-500 hover:bg-surface-sunken",
      )}
    >
      <Icon
        className={cn("size-4.75 shrink-0", active ? "text-ink-900" : "text-ink-450")}
        aria-hidden="true"
      />
      <span className="flex-1">{label}</span>
      {count !== null && <span className="text-[13px] font-normal text-ink-400">{count}</span>}
    </button>
  );
}
