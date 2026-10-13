"use client";

import { Plus, SlidersHorizontal } from "lucide-react";

import { useQuickAdd } from "../model/use-quick-add";

type QuickAddBarProps = {
  tripId: string;
  onToast: (text: string) => void;
  /** 「자세히」 — 치던 제목을 넘기고 칸을 비운다 */
  onDetail: (title: string) => void;
};

/**
 * 목록 맨 위 빠른 추가 바(48 · r12 · 흰 바탕, 누르면 블루 테두리) — 「+」 · 입력 · 글이 있으면 「추가」 · 「자세히」(마감일 · 연결 · 메모까지 넣는 폼).
 * 붙는 위치(sticky)는 감싸는 쪽이 정한다
 */
export function QuickAddBar({ tripId, onToast, onDetail }: QuickAddBarProps) {
  const quick = useQuickAdd(tripId, onToast);
  return (
    <div className="flex h-12 items-center gap-2 rounded-card border border-line bg-white pr-1.5 pl-3.5 shadow-[0_1px_6px_rgba(0,0,0,0.05)] focus-within:border-primary">
      <Plus className="size-4.5 shrink-0 text-primary" strokeWidth={2.2} aria-hidden="true" />
      <input
        value={quick.text}
        onChange={(e) => quick.setText(e.target.value)}
        onKeyDown={quick.onKeyDown}
        maxLength={100}
        placeholder="항목 추가 · Enter로 바로 담기"
        aria-label="체크리스트 항목 추가"
        className="min-w-0 flex-1 bg-transparent text-[15px] text-ink-900 outline-none placeholder:text-ink-350"
      />
      {quick.text.trim() && (
        <button
          type="button"
          onClick={quick.submit}
          className="h-8.5 shrink-0 rounded-button bg-primary px-3 text-sm font-bold text-white"
        >
          추가
        </button>
      )}
      <button
        type="button"
        onClick={() => {
          onDetail(quick.text);
          quick.setText("");
        }}
        title="마감일·연결까지 자세히 입력"
        className="flex h-8.5 shrink-0 items-center gap-1 rounded-button px-2.5 text-[13px] font-bold text-ink-500 hover:bg-surface-muted"
      >
        <SlidersHorizontal className="size-3.75" aria-hidden="true" />
        자세히
      </button>
    </div>
  );
}
