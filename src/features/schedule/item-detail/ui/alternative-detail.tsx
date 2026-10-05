"use client";

import { useEffect, useMemo } from "react";

import type { City } from "@/entities/city";
import {
  buildTimeline,
  type Place,
  type ScheduleItem,
  type TimelineRow,
} from "@/entities/schedule-item";
import { dayOfWeek } from "@/shared/lib/days";

import { useAlternativeActions } from "../model/use-alternative-actions";
import { useMemoEdit } from "../model/use-memo-edit";
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
  onSwapped: (altId: string) => void;
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
}: AlternativeDetailProps) {
  const plan = usePlanEdit(tripId, alt);
  const memo = useMemoEdit(tripId, alt);
  const actions = useAlternativeActions(tripId, row.item, onSwapped);
  const locked = plan.locked || memo.locked || actions.locked;
  useEffect(() => onLockChange(locked), [locked, onLockChange]);
  // 표시용 줄(아이콘 · 메모 줄 · 그날 운영시간). 대체 장소는 번호 · 이동이 없다
  const altRow = useMemo(
    () => buildTimeline([alt], [], dayOfWeek(startDate, alt.day_index))[0],
    [alt, startDate],
  );
  const content = (
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 pt-4 pb-7">
      <DetailContent
        tripId={tripId}
        startDate={startDate}
        row={altRow}
        plan={plan}
        memo={memo}
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
      actions={actions}
      locked={locked}
      onBack={onBack}
      onClose={onClose}
    />
  );
  return isDesktop ? (
    <PcLayout
      header={header}
      content={content}
      onAddMemo={memo.text === null ? memo.start : null}
    />
  ) : (
    <MobileLayout header={header} content={content} />
  );
}
