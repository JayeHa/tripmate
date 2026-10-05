"use client";

import { ArrowLeftRight, ChevronRight, X } from "lucide-react";
import { useState } from "react";

import { itemName, type ScheduleItem, useMemos } from "@/entities/schedule-item";

import { hasOwnRecord } from "../lib/alternatives";
import type { AlternativeActions } from "../model/use-alternative-actions";
import { AlternativePicker } from "./alternative-picker";
import { RemoveAlternativeDialog } from "./remove-alternative-dialog";

type AlternativesBlockProps = {
  tripId: string;
  main: ScheduleItem;
  alternatives: ScheduleItem[];
  actions: AlternativeActions;
  /** 「+ 직접 추가」 — 부른 쪽이 장소 입력 폼을 대체 장소 모드로 연다 */
  onDirectAdd: () => void;
  /** 카드를 누르면 그 대체 장소의 상세(메모 · 예약 상태를 바꾸기 없이 보고 고친다) */
  onOpen: (alt: ScheduleItem) => void;
};

/**
 * 대체 장소 — 이 일정이 안 될 때 갈 곳. 카드마다 이름 · 설명(누르면 그 대체 장소의 상세) · 「바꾸기」 · 빼기, 아래 「+ 대체 장소」.
 * 바꾸기는 그 장소가 이 자리(날짜 · 순서 · 시간)에 들어가고, 예약 상태 · 메모는 각자 장소를 따라간다
 */
export function AlternativesBlock({
  tripId,
  main,
  alternatives,
  actions,
  onDirectAdd,
  onOpen,
}: AlternativesBlockProps) {
  const [picking, setPicking] = useState(false);
  const { data: memos = [] } = useMemos(tripId);
  /** 그 대체 장소 줄에 붙은 메모 수 — 빼기 전에 물을지 정한다 */
  const memoCount = (id: string) => memos.filter((m) => m.schedule_item_id === id).length;
  return (
    <section className="flex flex-col gap-2">
      <span className="text-[13px] font-bold text-ink-400">대체 장소 {alternatives.length}</span>
      {alternatives.map((alt) => (
        <AlternativeCard
          key={alt.id}
          alt={alt}
          memoCount={memoCount(alt.id)}
          actions={actions}
          onOpen={() => onOpen(alt)}
        />
      ))}
      {picking ? (
        <AlternativePicker
          tripId={tripId}
          main={main}
          alternatives={alternatives}
          actions={actions}
          onClose={() => setPicking(false)}
          onDirectAdd={() => {
            setPicking(false);
            onDirectAdd();
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setPicking(true)}
          className="h-10.5 rounded-card border-[1.5px] border-dashed border-line-strong text-sm font-bold text-primary"
        >
          + 대체 장소
        </button>
      )}
      {actions.error && <p className="text-[13px] text-destructive">{actions.error}</p>}
    </section>
  );
}

type AlternativeCardProps = {
  alt: ScheduleItem;
  memoCount: number;
  actions: AlternativeActions;
  onOpen: () => void;
};

/** 대체 장소 카드 하나. 이름 · 설명을 누르면 상세로. 자기 기록(상태 · 메모 · 링크)이 있으면 빼기 전에 묻는다 */
function AlternativeCard({ alt, memoCount, actions, onOpen }: AlternativeCardProps) {
  const [confirming, setConfirming] = useState(false);
  const sub = alt.place?.description;
  return (
    <div className="flex items-center gap-2 rounded-card border border-line-card px-3.5 py-3">
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left"
      >
        <span className="flex items-center gap-1 text-[15px] font-bold text-ink-900">
          {alt.emoji && <span className="font-normal">{alt.emoji}</span>}
          {itemName(alt)}
          <ChevronRight className="size-4 shrink-0 text-ink-350" />
        </span>
        {sub && <span className="text-[13px] text-ink-500">{sub}</span>}
      </button>
      <button
        type="button"
        disabled={actions.pending}
        onClick={() => actions.swap(alt)}
        className="flex h-8 shrink-0 items-center gap-1 rounded-button border border-line-strong px-2.5 text-[13px] font-bold text-ink-700 disabled:opacity-40"
      >
        <ArrowLeftRight className="size-3.5" />
        바꾸기
      </button>
      <button
        type="button"
        aria-label={`${itemName(alt)} 대체 장소에서 빼기`}
        disabled={actions.pending}
        onClick={() => (hasOwnRecord(alt, memoCount) ? setConfirming(true) : actions.remove(alt))}
        className="flex size-8 shrink-0 items-center justify-center text-ink-400 disabled:opacity-40"
      >
        <X className="size-4" />
      </button>
      <RemoveAlternativeDialog
        open={confirming}
        onOpenChange={setConfirming}
        onConfirm={() => actions.remove(alt)}
      />
    </div>
  );
}
