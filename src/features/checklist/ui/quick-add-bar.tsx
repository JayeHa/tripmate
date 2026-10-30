"use client";

import { ChevronRight, Plus, SlidersHorizontal } from "lucide-react";

import { useMediaQuery } from "@/shared/lib/use-media-query";
import { QuickSubmitButton } from "@/shared/ui/quick-submit-button";

import { useQuickAdd } from "../model/use-quick-add";

type QuickAddBarProps = {
  tripId: string;
  onToast: (text: string) => void;
  /** 「자세히」 — 치던 제목을 넘기고 칸을 비운다 */
  onDetail: (title: string) => void;
};

/**
 * 목록 맨 위 빠른 추가 바(48 · r12 · 흰 바탕, 누르면 블루 테두리) — 「+」 · 입력 · 「등록」 · 「자세히」(마감일 · 연결 · 메모까지 넣는 폼).
 * 모바일은 「등록」 이 늘 보이고 「자세히」 는 바 아래 오른쪽 링크로, PC 는 「등록」 이 글이 있을 때만 · 「자세히」 는 바 안에.
 * 붙는 위치(sticky)는 감싸는 쪽이 정한다
 */
export function QuickAddBar({ tripId, onToast, onDetail }: QuickAddBarProps) {
  const quick = useQuickAdd(tripId, onToast);
  const desktop = useMediaQuery("(min-width: 1024px)");
  /** 「자세히」 — 치던 제목을 넘기고 칸을 비운다 */
  const detail = () => {
    onDetail(quick.text);
    quick.setText("");
  };
  return (
    <div className="flex flex-col">
      <div className="flex h-12 items-center gap-2 rounded-card border border-line bg-white pr-1.5 pl-3.5 shadow-[0_1px_6px_rgba(0,0,0,0.05)] focus-within:border-primary">
        <Plus className="size-4.5 shrink-0 text-primary" strokeWidth={2.2} aria-hidden="true" />
        <input
          value={quick.text}
          onChange={(e) => quick.setText(e.target.value)}
          onKeyDown={quick.onKeyDown}
          maxLength={100}
          placeholder={desktop ? "항목 추가 · Enter로 바로 담기" : "항목 추가"}
          aria-label="체크리스트 항목 추가"
          enterKeyHint="done"
          className="min-w-0 flex-1 bg-transparent text-[15px] text-ink-900 outline-none placeholder:text-ink-350"
        />
        <QuickSubmitButton active={!!quick.text.trim()} onSubmit={quick.submit} />
        <button
          type="button"
          onClick={detail}
          title="마감일·연결까지 자세히 입력"
          className="hidden h-8.5 shrink-0 items-center gap-1 rounded-button px-2.5 text-[13px] font-bold text-ink-500 hover:bg-surface-muted lg:flex"
        >
          <SlidersHorizontal className="size-3.75" aria-hidden="true" />
          자세히
        </button>
      </div>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={detail}
        className="flex items-center gap-0.5 self-end px-1 pt-1.5 text-[13px] font-bold text-ink-450 lg:hidden"
      >
        마감일·연결까지 자세히 입력
        <ChevronRight className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
