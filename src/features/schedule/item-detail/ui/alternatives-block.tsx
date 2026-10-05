"use client";

import { ArrowLeftRight, ArrowUpRight, X } from "lucide-react";
import { useState } from "react";

import { isHttpUrl, itemName, type ScheduleItem } from "@/entities/schedule-item";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";

import { hasOwnRecord } from "../lib/alternatives";
import type { AlternativeActions } from "../model/use-alternative-actions";
import { AlternativePicker } from "./alternative-picker";

type AlternativesBlockProps = {
  tripId: string;
  main: ScheduleItem;
  alternatives: ScheduleItem[];
  actions: AlternativeActions;
  /** 「+ 직접 추가」 — 부른 쪽이 장소 입력 폼을 대체 장소 모드로 연다 */
  onDirectAdd: () => void;
};

/**
 * 대체 장소 — 이 일정이 안 될 때 갈 곳. 카드마다 이름(구글맵 ↗) · 설명 · 「바꾸기」 · 지우기, 아래 「+ 대체 장소」.
 * 바꾸기는 그 장소가 이 자리(날짜 · 순서 · 시간)에 들어가고, 예약 상태 · 메모는 각자 장소를 따라간다
 */
export function AlternativesBlock({
  tripId,
  main,
  alternatives,
  actions,
  onDirectAdd,
}: AlternativesBlockProps) {
  const [picking, setPicking] = useState(false);
  return (
    <section className="flex flex-col gap-2">
      <span className="text-[13px] font-bold text-ink-400">대체 장소 {alternatives.length}</span>
      {alternatives.map((alt) => (
        <AlternativeCard key={alt.id} alt={alt} actions={actions} />
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

type AlternativeCardProps = { alt: ScheduleItem; actions: AlternativeActions };

/** 대체 장소 카드 하나. 자기 기록(상태 · 메모 · 링크)이 있으면 지우기 전에 묻는다 */
function AlternativeCard({ alt, actions }: AlternativeCardProps) {
  const [confirming, setConfirming] = useState(false);
  const gmap = alt.place?.gmap_url;
  const sub = alt.place?.description;
  return (
    <div className="flex items-center gap-2 rounded-card border border-line-card px-3.5 py-3">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {isHttpUrl(gmap) ? (
          <a
            href={gmap}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[15px] font-bold text-ink-900"
          >
            {itemName(alt)}
            <ArrowUpRight className="size-3.5 shrink-0 text-primary" />
          </a>
        ) : (
          <span className="text-[15px] font-bold text-ink-900">{itemName(alt)}</span>
        )}
        {sub && <span className="text-[13px] text-ink-500">{sub}</span>}
      </div>
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
        onClick={() => (hasOwnRecord(alt) ? setConfirming(true) : actions.remove(alt))}
        className="flex size-8 shrink-0 items-center justify-center text-ink-400 disabled:opacity-40"
      >
        <X className="size-4" />
      </button>
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>대체 장소에서 뺄까요?</AlertDialogTitle>
            <AlertDialogDescription>
              이 장소에 적어 둔 예약 상태 · 메모 · 링크가 함께 지워져요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => actions.remove(alt)}>
              빼기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
