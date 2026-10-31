"use client";

import { ChevronDown, ChevronUp, CircleCheck } from "lucide-react";
import { useState } from "react";

import { usedLabel } from "@/entities/voucher";

import type { ViewerNumber } from "../lib/voucher-view";
import { NumberCopyRow } from "./number-copy-row";

type ViewerPanelProps = {
  numbers: ViewerNumber[];
  memo: string;
  /** 화면 꺼짐 방지가 걸렸다 — 맨 아래 안내 */
  awake: boolean;
  /** 쓴 시각(아직 안 썼으면 null)과 「사용했어요」 · 되돌리기 */
  used: { at: string | null; onToggle: () => void };
};

/**
 * 뷰어 아래 흰 판(위 r22) — 번호 줄(일행 번호는 접어 두고 「일행 번호 보기」 로 펼친다) · 메모(세 줄까지) ·
 * 「사용했어요」(쓴 뒤에는 「10.31 14:05 사용함 · 되돌리기」) · 「보는 동안 화면이 꺼지지 않아요」.
 * 현장에서 보여 준 그 자리에서 누르게 판 맨 아래(안내 바로 위)에 둔다
 */
export function ViewerPanel({ numbers, memo, awake, used }: ViewerPanelProps) {
  const [othersOpen, setOthersOpen] = useState(false);
  const others = numbers.filter((n) => n.owner && !n.mine);
  const shown = othersOpen ? numbers : numbers.filter((n) => !others.includes(n));
  return (
    <div className="flex shrink-0 flex-col gap-2 rounded-t-sheet bg-white px-5 pt-4 pb-[calc(1.75rem+env(safe-area-inset-bottom))]">
      {shown.map((n) => (
        <NumberCopyRow key={n.key} label={n.text} value={n.value} mine={n.mine} />
      ))}
      {others.length > 0 && (
        <button
          type="button"
          onClick={() => setOthersOpen((o) => !o)}
          className="flex items-center justify-center gap-0.5 py-1 text-xs font-bold text-ink-500"
        >
          {othersOpen ? "접기" : "일행 번호 보기"}
          {othersOpen ? (
            <ChevronUp className="size-3.5" aria-hidden="true" />
          ) : (
            <ChevronDown className="size-3.5" aria-hidden="true" />
          )}
        </button>
      )}
      {memo && (
        <p className="line-clamp-3 rounded-card bg-surface-sunken px-3 py-2.5 text-[13px]/normal whitespace-pre-line text-ink-700">
          {memo}
        </p>
      )}
      <UsedRow at={used.at} onToggle={used.onToggle} />
      {awake && (
        <p className="text-center text-[11px] text-ink-400">보는 동안 화면이 꺼지지 않아요</p>
      )}
    </div>
  );
}

type UsedRowProps = { at: string | null; onToggle: () => void };

/** 「사용했어요」 버튼(44 · 회색 바탕) — 쓴 뒤에는 파랑 체크 「10.31 14:05 사용함」 + 오른쪽 「되돌리기」 */
function UsedRow({ at, onToggle }: UsedRowProps) {
  if (!at) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="flex h-11 items-center justify-center gap-1.5 rounded-button bg-surface-muted text-sm font-bold text-ink-700"
      >
        <CircleCheck className="size-4.5" aria-hidden="true" />
        사용했어요
      </button>
    );
  }
  return (
    <div className="flex h-11 items-center gap-1.5 rounded-button bg-surface-sunken px-3.5">
      <CircleCheck className="size-4.5 text-brand-text" aria-hidden="true" />
      <span className="flex-1 text-sm font-bold text-ink-700">{usedLabel(at)} 사용함</span>
      <button type="button" onClick={onToggle} className="text-[13px] font-bold text-ink-450">
        되돌리기
      </button>
    </div>
  );
}
