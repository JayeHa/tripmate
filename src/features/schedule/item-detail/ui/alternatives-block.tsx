"use client";

import { ArrowLeftRight, ChevronRight, X } from "lucide-react";
import { useState } from "react";

import { linkedChecklistCount, useChecklistIndex } from "@/entities/checklist";
import { useExpenses } from "@/entities/expense";
import { itemName, type ScheduleItem, useMemos } from "@/entities/schedule-item";
import { linkedVoucherCount, useVouchers } from "@/entities/voucher";
import { CircleAddButton } from "@/shared/ui/add-controls";

import { hasOwnRecord, type LinkedExpenses, linkedExpensesOf } from "../lib/alternatives";
import type { AlternativeActions } from "../model/use-alternative-actions";
import { RemoveAlternativeDialog } from "./remove-alternative-dialog";
import { SwapAlternativeDialog } from "./swap-alternative-dialog";

type AlternativesBlockProps = {
  tripId: string;
  main: ScheduleItem;
  alternatives: ScheduleItem[];
  actions: AlternativeActions;
  /** 제목 오른쪽 「+」 — 부른 쪽이 「대체 장소 추가」 창을 연다 */
  onAdd: () => void;
  /** 카드를 누르면 그 대체 장소의 상세(메모 · 예약 상태를 바꾸기 없이 보고 고친다) */
  onOpen: (alt: ScheduleItem) => void;
};

/**
 * 대체 장소 — 이 일정이 안 될 때 갈 곳. 「대체 장소 N」 + 회색 원 「+」(「대체 장소 추가」 창), 카드마다 이름 · 설명(누르면 그 대체 장소의 상세) · 「바꾸기」 · 빼기.
 * 대체 장소가 없으면 칸을 그리지 않는다(맨 아래 「추가」 줄의 칩으로 연다).
 * 바꾸기는 그 장소가 이 자리(날짜 · 순서 · 시간)에 들어가고, 예약 상태 · 메모는 각자 장소를 따라간다
 */
export function AlternativesBlock({
  tripId,
  main,
  alternatives,
  actions,
  onAdd,
  onOpen,
}: AlternativesBlockProps) {
  const { data: memos = [] } = useMemos(tripId);
  /** 그 대체 장소 줄에 붙은 메모 수 — 빼기 전에 물을지 정한다 */
  const memoCount = (id: string) => memos.filter((m) => m.schedule_item_id === id).length;
  const { data: expenses = [] } = useExpenses(tripId);
  const checklist = useChecklistIndex(tripId);
  const { data: vouchers = [] } = useVouchers(tripId);
  if (alternatives.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-bold text-ink-400">대체 장소 {alternatives.length}</span>
        <CircleAddButton label="대체 장소 추가" onClick={onAdd} />
      </div>
      {alternatives.map((alt) => (
        <AlternativeCard
          key={alt.id}
          main={main}
          alt={alt}
          memoCount={memoCount(alt.id)}
          linkedExpenses={linkedExpensesOf(expenses, alt.id)}
          checklistCount={linkedChecklistCount(checklist, [alt.id])}
          voucherCount={linkedVoucherCount(vouchers, [alt.id])}
          actions={actions}
          onOpen={() => onOpen(alt)}
        />
      ))}
    </section>
  );
}

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
};

/**
 * 대체 장소 카드 하나. 이름 · 설명을 누르면 상세로. 「바꾸기」 는 한 번 묻고, 빼기는 자기 기록(상태 · 메모 · 링크 · 연결된 비용 · 체크리스트)이 있으면 묻는다
 */
function AlternativeCard({
  main,
  alt,
  memoCount,
  linkedExpenses,
  checklistCount,
  voucherCount,
  actions,
  onOpen,
}: AlternativeCardProps) {
  const [confirming, setConfirming] = useState(false);
  const [swapping, setSwapping] = useState(false);
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
