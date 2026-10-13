"use client";

import { useMemo } from "react";

import type { City } from "@/entities/city";
import { useExpenses } from "@/entities/expense";
import {
  buildTimeline,
  type Memo,
  type Place,
  type ScheduleItem,
  type TimelineRow,
  useMemos,
} from "@/entities/schedule-item";
import { dayOfWeek } from "@/shared/lib/days";
import { useReportLock } from "@/shared/lib/use-dialog-state";

import { linkedExpensesOf } from "../lib/alternatives";
import { useAlternativeActions } from "../model/use-alternative-actions";
import { usePlanEdit } from "../model/use-plan-edit";
import { AlternativeHeader } from "./alternative-header";
import { DetailContent } from "./detail-content";
import { MobileLayout, PcLayout } from "./detail-layout";

type AlternativeDetailProps = {
  tripId: string;
  startDate: string;
  /** 원래 일정(이 대체 장소가 붙은 타임라인 줄) */
  row: TimelineRow;
  alt: ScheduleItem;
  isDesktop: boolean;
  onBack: () => void;
  onClose: () => void;
  onLockChange: (locked: boolean) => void;
  onEditPlace: (place: Place, city: City | null) => void;
  /** 「이 장소로 바꾸기」 가 끝났다 — 상세가 이 대체 장소(이제 그 자리의 일정)로 옮겨 간다 */
  onSwapped: (altId: string, message: string) => void;
  /** 메모 쓰기 · 고치기 — 이 대체 장소 줄에 붙는다 */
  onMemo: (row: TimelineRow, memo: Memo | null) => void;
  /** 비용 쓰기 · 고치기 — 이 대체 장소 줄에 연결된다 */
  onExpense: (itemId: string, expenseId: string | null) => void;
  /** 체크리스트 칸의 완료 · 실패 토스트 */
  onToast: (message: string) => void;
};

/**
 * 대체 장소의 상세 — 바꾸기 없이 그 장소의 정보를 보고 이번 일정(예약 상태 · 링크 · 아이콘) · 메모를 고친다.
 * 원래 일정의 상세와 같은 본문에서 대체 장소 칸만 빠진다. 시간은 자리의 것이라 고칠 수 없다(PlanSection 이 안내)
 */
export function AlternativeDetail({
  tripId,
  startDate,
  row,
  alt,
  isDesktop,
  onBack,
  onClose,
  onLockChange,
  onEditPlace,
  onSwapped,
  onMemo,
  onExpense,
  onToast,
}: AlternativeDetailProps) {
  const plan = usePlanEdit(tripId, alt);
  const actions = useAlternativeActions(tripId, row.item, onSwapped);
  const locked = plan.locked || actions.locked;
  const { data: memos = [] } = useMemos(tripId);
  const { data: expenses = [] } = useExpenses(tripId);
  useReportLock(locked, onLockChange);
  // 표시용 줄(아이콘 · 메모 줄 · 그날 운영시간). 대체 장소는 번호 · 이동이 없다
  const altRow = useMemo(
    () => buildTimeline([alt], [], dayOfWeek(startDate, alt.day_index), [], memos)[0],
    [alt, startDate, memos],
  );
  const content = (
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 pt-4 pb-7">
      <DetailContent
        tripId={tripId}
        startDate={startDate}
        row={altRow}
        plan={plan}
        onMemo={(memo) => onMemo(altRow, memo)}
        onExpense={(expenseId) => onExpense(alt.id, expenseId)}
        onToast={onToast}
        alternatives={null}
        onEditPlace={onEditPlace}
      />
      {actions.error && <p className="text-[13px] text-destructive">{actions.error}</p>}
    </div>
  );
  const header = (
    <AlternativeHeader
      main={row.item}
      alt={alt}
      memoCount={altRow.memos.length}
      linkedExpenses={linkedExpensesOf(expenses, alt.id)}
      actions={actions}
      locked={locked}
      onBack={onBack}
      onClose={onClose}
    />
  );
  return isDesktop ? (
    <PcLayout header={header} content={content} />
  ) : (
    <MobileLayout header={header} content={content} />
  );
}
