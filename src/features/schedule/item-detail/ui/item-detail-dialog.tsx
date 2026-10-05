"use client";

import { useEffect, useState } from "react";

import type { City } from "@/entities/city";
import type { Memo, Place, ScheduleItem, TimelineRow } from "@/entities/schedule-item";
import { Dialog, DialogContent } from "@/shared/ui/dialog";

import { useAlternativeActions } from "../model/use-alternative-actions";
import { useItemActions } from "../model/use-item-actions";
import { usePlanEdit } from "../model/use-plan-edit";
import { AlternativeDetail } from "./alternative-detail";
import { DetailContent } from "./detail-content";
import { DetailHeader } from "./detail-header";
import { MobileLayout, PcLayout } from "./detail-layout";

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
  /** 「장소 정보 수정」 — 부른 쪽이 장소 입력 폼(수정 모드)을 상세 위에 연다 */
  onEditPlace: (place: Place, city: City | null) => void;
  /** 대체 장소 「+ 직접 추가」 — 부른 쪽이 장소 입력 폼을 이 일정의 대체 장소 모드로 연다 */
  onAddAlternative: (main: ScheduleItem, city: City | null) => void;
  /** 「바꾸기」 가 끝났다 — 새로 그 자리에 들어온 일정(altId)으로 상세를 옮긴다 */
  onSwapped: (altId: string) => void;
  /** 메모 쓰기 · 고치기 — 부른 쪽이 그 일정(줄)의 메모 작성 창을 상세 위에 연다. 새로 쓰면 memo 는 null */
  onMemo: (row: TimelineRow, memo: Memo | null) => void;
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

export type DetailBodyProps = Omit<ItemDetailDialogProps, "row"> & {
  row: TimelineRow;
  onLockChange: (locked: boolean) => void;
};

/**
 * 상세 내용. 일정마다 새로 마운트돼(key) 수정 칸이 이전 일정 값을 들고 오지 않는다.
 * 대체 장소 카드를 누르면 같은 창 안에서 그 대체 장소의 상세로 넘어간다(머리의 ← 로 돌아온다).
 * 보던 대체 장소가 빠지면(빼기 · 일행이 지움) 원래 일정으로 돌아온다
 */
function DetailBody(props: DetailBodyProps) {
  const [altId, setAltId] = useState<string | null>(null);
  const alt = props.row.alternatives.find((a) => a.id === altId) ?? null;
  if (altId && !alt) setAltId(null);
  if (alt) {
    return <AlternativeDetail key={alt.id} {...props} alt={alt} onBack={() => setAltId(null)} />;
  }
  return <MainDetail {...props} onOpenAlternative={setAltId} />;
}

type MainDetailProps = DetailBodyProps & { onOpenAlternative: (altId: string) => void };

/** 원래 일정의 상세 — 장소 정보 · 이번 일정 · 메모 · 대체 장소 */
function MainDetail({
  tripId,
  startDate,
  totalDays,
  row,
  dayItems,
  isDesktop,
  onClose,
  onLockChange,
  onEditPlace,
  onAddAlternative,
  onSwapped,
  onMemo,
  onOpenAlternative,
}: MainDetailProps) {
  const plan = usePlanEdit(tripId, row.item);
  const actions = useItemActions(tripId, row.item, dayItems, onClose);
  const alternatives = useAlternativeActions(tripId, row.item, onSwapped);
  const locked = plan.locked || actions.locked || alternatives.locked;
  useEffect(() => onLockChange(locked), [locked, onLockChange]);
  const content = (
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 pt-4 pb-7">
      <DetailContent
        tripId={tripId}
        startDate={startDate}
        row={row}
        plan={plan}
        onMemo={(memo) => onMemo(row, memo)}
        alternatives={{
          actions: alternatives,
          onAdd: (city) => onAddAlternative(row.item, city),
          onOpen: (alt) => onOpenAlternative(alt.id),
        }}
        onEditPlace={onEditPlace}
      />
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
    <PcLayout header={header} content={content} />
  ) : (
    <MobileLayout header={header} content={content} />
  );
}
