"use client";

import { Plus } from "lucide-react";

import { useQuickAdd } from "../model/use-quick-add";

type QuickAddBarProps = {
  tripId: string;
  onToast: (text: string) => void;
};

/**
 * 목록 맨 위 빠른 추가 바(48 · r12 · 흰 바탕, 누르면 블루 테두리) — 「+」 · 입력 · 글이 있으면 「추가」.
 * 붙는 위치(sticky)는 감싸는 쪽이 정한다
 */
export function QuickAddBar({ tripId, onToast }: QuickAddBarProps) {
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
    </div>
  );
}
