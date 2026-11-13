"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

import { usedLabel } from "@/entities/voucher";
import { cn } from "@/shared/lib/utils";

import type { ViewerNumber } from "../lib/voucher-view";
import { NumberCopyRow } from "./number-copy-row";

type ViewerPanelProps = {
  numbers: ViewerNumber[];
  memo: string;
  /** 화면 꺼짐 방지가 걸렸다 — 안 쓴 바우처의 버튼 아래 안내 */
  awake: boolean;
  /** 쓴 시각(아직 안 썼으면 null)과 「사용했어요」 · 되돌리기 */
  used: { at: string | null; onToggle: () => void };
};

/**
 * 뷰어 아래 흰 판(위 r22) — 번호 줄(일행 번호는 접어 두고 「일행 번호 보기」 로 펼친다) · 메모(세 줄까지) ·
 * 「사용했어요」 버튼과 그 아래 안내. 현장에서 보여 준 그 자리에서 누르게 판 맨 아래에 둔다
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
      <UsedButton at={used.at} onToggle={used.onToggle} />
      <UsedHint used={used.at !== null} awake={awake} />
    </div>
  );
}

type UsedButtonProps = { at: string | null; onToggle: () => void };

/**
 * 「사용했어요」 버튼(48 · r12 · 15/800) — 안 썼으면 초록 바탕, 썼으면 옅은 초록 「✓ 사용함 · 10.31 14:05」.
 * 쓴 뒤에 한 번 더 누르면 되돌린다
 */
function UsedButton({ at, onToggle }: UsedButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={at !== null}
      onClick={onToggle}
      className={cn(
        "flex h-12 shrink-0 items-center justify-center rounded-card border text-[15px] font-extrabold",
        at
          ? "border-visited-line bg-visited-soft text-visited-text"
          : "border-visited bg-visited text-white",
      )}
    >
      {at ? `✓ 사용함 · ${usedLabel(at)}` : "사용했어요"}
    </button>
  );
}

type UsedHintProps = { used: boolean; awake: boolean };

/** 버튼 아래 안내 — 쓴 뒤에는 되돌리는 법, 그 전에는 화면 꺼짐 방지가 걸렸을 때만 그 안내 */
function UsedHint({ used, awake }: UsedHintProps) {
  if (!used && !awake) return null;
  return (
    <p className="text-center text-[11px] text-ink-400">
      {used ? "잘못 눌렀다면 한 번 더 눌러 되돌려요" : "보는 동안 화면이 꺼지지 않아요"}
    </p>
  );
}
