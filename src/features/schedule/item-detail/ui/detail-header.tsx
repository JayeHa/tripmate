import { X } from "lucide-react";

import { itemName, NumberMarker, type TimelineRow } from "@/entities/schedule-item";
import { dayLabel } from "@/shared/lib/days";
import { DialogTitle } from "@/shared/ui/dialog";

import type { LinkedExpenses } from "../lib/alternatives";
import type { ItemActions } from "../model/use-item-actions";
import { ItemMenu } from "./item-menu";

type DetailHeaderProps = {
  row: TimelineRow;
  startDate: string;
  totalDays: number;
  actions: ItemActions;
  /** 이 일정과 그 대체 장소에 연결된 비용 — 삭제 확인에서 알린다 */
  linkedExpenses: LinkedExpenses;
  /** 요청이 서버에 가 있는 동안 — 닫기를 막는다 */
  locked: boolean;
  onClose: () => void;
};

/** 상세 머리 — 번호 마커 · 제목(아이콘 + 이름) · 「day 3 · 11.2 (월) 16:40」 · ⋯ · 닫기. 연회색 바탕(장소 정보 띠와 이어진다) */
export function DetailHeader({
  row,
  startDate,
  totalDays,
  actions,
  linkedExpenses,
  locked,
  onClose,
}: DetailHeaderProps) {
  const item = row.item;
  const when = [`day ${item.day_index + 1} · ${dayLabel(startDate, item.day_index)}`, row.time]
    .filter(Boolean)
    .join(" ");
  return (
    <div className="flex shrink-0 items-center gap-3 bg-surface-sunken px-5 py-3.5">
      <NumberMarker kind={row.kind} num={row.num} status={row.status} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <DialogTitle className="truncate text-lg font-extrabold tracking-[-0.01em] text-ink-900">
          {row.emoji && <span className="mr-1.5 font-normal">{row.emoji}</span>}
          {itemName(item)}
        </DialogTitle>
        <span className="text-[13px] text-ink-400">{when}</span>
      </div>
      {/* 항공편은 항공편 화면에서 옮기고 지운다 */}
      {row.kind !== "flight" && (
        <ItemMenu
          actions={actions}
          dayIndex={item.day_index}
          alternativeCount={row.alternatives.length}
          linkedExpenses={linkedExpenses}
          startDate={startDate}
          totalDays={totalDays}
        />
      )}
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        disabled={locked}
        className="flex text-ink-400 disabled:opacity-40"
      >
        <X className="size-5.5" strokeWidth={2} />
      </button>
    </div>
  );
}
