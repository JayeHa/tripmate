"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

import type { ViewerNumber } from "../lib/voucher-view";
import { NumberCopyRow } from "./number-copy-row";

type ViewerPanelProps = {
  numbers: ViewerNumber[];
  memo: string;
  /** 화면 꺼짐 방지가 걸렸다 — 맨 아래 안내 */
  awake: boolean;
};

/**
 * 뷰어 아래 흰 판(위 r22) — 번호 줄(일행 번호는 접어 두고 「일행 번호 보기」 로 펼친다) · 메모(세 줄까지) ·
 * 「보는 동안 화면이 꺼지지 않아요」. 보일 것이 없으면 그리지 않는다
 */
export function ViewerPanel({ numbers, memo, awake }: ViewerPanelProps) {
  const [othersOpen, setOthersOpen] = useState(false);
  const others = numbers.filter((n) => n.owner && !n.mine);
  const shown = othersOpen ? numbers : numbers.filter((n) => !others.includes(n));
  if (numbers.length === 0 && !memo && !awake) return null;
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
      {awake && (
        <p className="text-center text-[11px] text-ink-400">보는 동안 화면이 꺼지지 않아요</p>
      )}
    </div>
  );
}
