"use client";

import { ArrowLeftRight, ChevronRight, X } from "lucide-react";
import { useState } from "react";

import { itemName, type ScheduleItem } from "@/entities/schedule-item";
import { cn } from "@/shared/lib/utils";

import type { AltPin } from "../lib/alt-map";
import { hasOwnRecord, type LinkedExpenses } from "../lib/alternatives";
import type { AlternativeActions } from "../model/use-alternative-actions";
import { RemoveAlternativeDialog } from "./remove-alternative-dialog";
import { SwapAlternativeDialog } from "./swap-alternative-dialog";

type AlternativeCardProps = {
  main: ScheduleItem;
  alt: ScheduleItem;
  memoCount: number;
  /** 이 대체 장소에 연결된 비용 — 빼기 전에 물을지 · 무엇을 알릴지 정한다 */
  linkedExpenses: LinkedExpenses;
  /** 이 대체 장소에 직접 연결된 체크리스트 항목 수 — 빼면 연결이 풀리므로 묻는다 */
  checklistCount: number;
  /** 이 대체 장소에 직접 연결된 바우처 수 — 빼면 연결이 풀리므로 묻는다 */
  voucherCount: number;
  actions: AlternativeActions;
  onOpen: () => void;
  /** 미니 지도의 핀(글자 · 도보 N분). 좌표가 없거나 지도가 없으면 null */
  pin: AltPin | null;
  /** 지도에서 이 장소를 고른 상태 — 연파랑 줄 */
  selected: boolean;
  /** 지도에서 고르기 · 풀기 */
  onToggle: () => void;
};

/**
 * 대체 장소 카드 하나. 이름을 누르면 상세로. 「바꾸기」 는 한 번 묻고, 빼기는 자기 기록(상태 · 메모 · 링크 · 연결된 비용 · 체크리스트)이 있으면 묻는다.
 * 미니 지도가 있으면 왼쪽 점선 원 A · B 와 「지금 장소에서 도보 N분」, 카드(이름 · 버튼 밖)를 누르면 지도에서 그 장소를 고르고 다시 누르면 푼다
 */
export function AlternativeCard({
  main,
  alt,
  memoCount,
  linkedExpenses,
  checklistCount,
  voucherCount,
  actions,
  onOpen,
  pin,
  selected,
  onToggle,
}: AlternativeCardProps) {
  const [confirming, setConfirming] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const sub = alt.place?.description;
  return (
    // 카드 빈 곳 · 설명 · 거리를 누르면 지도에서 고른다. 이름 · 바꾸기 · 빼기 버튼은 각자 동작한다.
    // 확인창(바꾸기 · 빼기)은 body 로 포털되지만 React 이벤트는 이 div 까지 올라온다 — DOM 으로 카드 안을 누른 것만 받는다
    <div
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (pin && e.currentTarget.contains(target) && !target.closest("button,a")) onToggle();
      }}
      className={cn(
        "flex items-center gap-2 rounded-card border px-3.5 py-3 transition-colors duration-250",
        selected ? "border-brand-line bg-row-focus" : "border-line-card bg-white",
        pin && "cursor-pointer",
      )}
    >
      {pin && (
        <button
          type="button"
          aria-pressed={selected}
          aria-label={`${itemName(alt)} 지도에서 보기`}
          onClick={onToggle}
          className="flex size-6.5 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-pin-opt bg-white text-xs font-extrabold text-status-opt"
        >
          {pin.tag}
        </button>
      )}
      <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
        <button
          type="button"
          onClick={onOpen}
          className="flex items-center gap-1 text-left text-[15px] font-bold text-ink-900"
        >
          {alt.emoji && <span className="font-normal">{alt.emoji}</span>}
          {itemName(alt)}
          <ChevronRight className="size-4 shrink-0 text-ink-350" />
        </button>
        {sub && <span className="text-[13px] text-ink-500">{sub}</span>}
        {pin && <span className="text-xs font-bold text-ink-400">지금 장소에서 {pin.walk}</span>}
      </div>
      <button
        type="button"
        disabled={actions.pending}
        onClick={() => setSwapping(true)}
        className="flex h-8 shrink-0 items-center gap-1 rounded-button border border-line-strong px-2.5 text-[13px] font-bold text-ink-700 disabled:opacity-40"
      >
        <ArrowLeftRight className="size-3.5" />
        바꾸기
      </button>
      <button
        type="button"
        aria-label={`${itemName(alt)} 대체 장소에서 빼기`}
        disabled={actions.pending}
        onClick={() =>
          hasOwnRecord(alt, memoCount, linkedExpenses.count, checklistCount, voucherCount)
            ? setConfirming(true)
            : actions.remove(alt)
        }
        className="flex size-8 shrink-0 items-center justify-center text-ink-400 disabled:opacity-40"
      >
        <X className="size-4" />
      </button>
      <SwapAlternativeDialog
        open={swapping}
        onOpenChange={setSwapping}
        main={main}
        alt={alt}
        onConfirm={() => actions.swap(alt)}
      />
      <RemoveAlternativeDialog
        open={confirming}
        onOpenChange={setConfirming}
        onConfirm={() => actions.remove(alt)}
        expenses={linkedExpenses}
        checklistCount={checklistCount}
        voucherCount={voucherCount}
      />
    </div>
  );
}
