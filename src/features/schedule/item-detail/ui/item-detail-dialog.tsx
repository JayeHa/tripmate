"use client";

import { useEffect, useState } from "react";

import type { ScheduleItem, TimelineRow } from "@/entities/schedule-item";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent } from "@/shared/ui/dialog";

import { useItemActions } from "../model/use-item-actions";
import { useMemoEdit } from "../model/use-memo-edit";
import { usePlanEdit } from "../model/use-plan-edit";
import { DetailContent } from "./detail-content";
import { DetailHeader } from "./detail-header";

/** 모바일: 아래에서 올라오는 시트(최대 90%, 위 22 둥글기) */
const MOBILE_CLASS =
  "top-auto bottom-0 left-0 flex max-h-[90dvh] w-full max-w-none translate-0 flex-col gap-0 overflow-hidden rounded-none rounded-t-sheet bg-white p-0 ring-0 sm:max-w-none";
/** PC: 가운데 560 모달(최대 680) */
const PC_CLASS =
  "flex max-h-[min(680px,calc(100dvh-2rem))] w-140 max-w-140 flex-col gap-0 overflow-hidden rounded-sheet bg-white p-0 shadow-sheet ring-0 sm:max-w-140";

type ItemDetailDialogProps = {
  tripId: string;
  startDate: string;
  totalDays: number;
  /** 보고 있는 일정의 타임라인 줄. null 이면 닫혀 있다. 고친 뒤에도 최신 값이 오도록 부른 쪽이 목록에서 다시 찾아 넘긴다 */
  row: TimelineRow | null;
  /** 그날 일정(position 순) — 앞으로 · 뒤로가 이웃을 찾는다 */
  dayItems: ScheduleItem[];
  isDesktop: boolean;
  onClose: () => void;
};

/**
 * 일정 상세 — 카드를 누르면 열린다. 모바일은 바텀시트, PC 는 가운데 모달.
 * 장소 정보(공용) · 이번 일정(이 방문만) · 메모 · 대체 장소를 보이고, 이번 일정 · 메모는 그 자리에서 고친다.
 */
export function ItemDetailDialog({ row, isDesktop, onClose, ...rest }: ItemDetailDialogProps) {
  // 저장 · 이동 · 삭제 요청이 서버에 가 있는 동안은 Esc · 바깥 클릭 · X 로 닫히지 않는다 — 닫히면 실패 문구가
  // 함께 사라져 저장된 줄 안다. 잠금 여부는 본문의 훅들이 알아서 본문이 알려 준다
  const [locked, setLocked] = useState(false);
  return (
    <Dialog open={!!row} onOpenChange={(open) => !open && !locked && onClose()}>
      <DialogContent showCloseButton={false} className={isDesktop ? PC_CLASS : MOBILE_CLASS}>
        {row && (
          <DetailBody
            key={row.item.id}
            row={row}
            isDesktop={isDesktop}
            onClose={onClose}
            onLockChange={setLocked}
            {...rest}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

type DetailBodyProps = Omit<ItemDetailDialogProps, "row"> & {
  row: TimelineRow;
  onLockChange: (locked: boolean) => void;
};

/** 상세 내용. 일정마다 새로 마운트돼(key) 수정 칸이 이전 일정 값을 들고 오지 않는다 */
function DetailBody({
  tripId,
  startDate,
  totalDays,
  row,
  dayItems,
  isDesktop,
  onClose,
  onLockChange,
}: DetailBodyProps) {
  const plan = usePlanEdit(tripId, row.item);
  const memo = useMemoEdit(tripId, row.item);
  const actions = useItemActions(tripId, row.item, dayItems, onClose);
  const locked = plan.locked || memo.locked || actions.locked;
  useEffect(() => onLockChange(locked), [locked, onLockChange]);
  const content = (
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 pt-4 pb-7">
      <DetailContent tripId={tripId} startDate={startDate} row={row} plan={plan} memo={memo} />
      {actions.error && <p className="text-[13px] text-destructive">{actions.error}</p>}
    </div>
  );
  const header = (
    <DetailHeader
      row={row}
      startDate={startDate}
      totalDays={totalDays}
      actions={actions}
      locked={locked}
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

type MobileLayoutProps = { header: React.ReactNode; content: React.ReactNode };

/** 모바일: 위 손잡이 · 머리 · 스크롤 본문 */
function MobileLayout({ header, content }: MobileLayoutProps) {
  return (
    <>
      <div className="flex shrink-0 justify-center bg-surface-sunken pt-2">
        <span aria-hidden="true" className="h-1 w-10 rounded-full bg-line" />
      </div>
      {header}
      {content}
    </>
  );
}

type PcLayoutProps = MobileLayoutProps & {
  /** 「+ 메모 추가」. 메모를 고치는 중이면 null(버튼 숨김) */
  onAddMemo: (() => void) | null;
};

/** PC: 머리 · 스크롤 본문 · 아래 안내 + 「+ 메모 추가」 */
function PcLayout({ header, content, onAddMemo }: PcLayoutProps) {
  return (
    <>
      {header}
      {content}
      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-surface-muted px-6 py-3.5">
        <span className="text-[13px] text-ink-400">「수정」을 누르면 바로 고칠 수 있어요</span>
        {onAddMemo && (
          <Button variant="outline" size="sm" onClick={onAddMemo}>
            + 메모 추가
          </Button>
        )}
      </div>
    </>
  );
}
