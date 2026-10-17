"use client";

import { MapPin, NotebookPen, Receipt } from "lucide-react";
import { type ReactNode, useState } from "react";

import type { City } from "@/entities/city";
import { useExpenses } from "@/entities/expense";
import { type Memo, type ScheduleItem, type TimelineRow, useMemos } from "@/entities/schedule-item";
import { cardVouchers, useVouchers } from "@/entities/voucher";
import { AddChip, AddChipRow } from "@/shared/ui/add-controls";

import type { AlternativeActions } from "../model/use-alternative-actions";
import type { DetailVoucherSlot } from "../model/voucher-slot";
import { AlternativePickerDialog } from "./alternative-picker-dialog";
import { AlternativesBlock } from "./alternatives-block";

/** 대체 장소 칸에 필요한 것 */
export type AlternativesSlot = {
  actions: AlternativeActions;
  /** 「+ 직접 추가」 — 장소 입력 폼을 이 일정의 대체 장소 모드로. 이 장소의 도시(검색 범위)를 넘긴다 */
  onAdd: (city: City | null) => void;
  /** 카드를 누르면 그 대체 장소의 상세로 */
  onOpen: (alt: ScheduleItem) => void;
};

type DetailExtrasProps = {
  tripId: string;
  row: TimelineRow;
  /** 대체 장소 칸 — 장소 일정이 아니거나 대체 장소의 상세면 null */
  alternatives: AlternativesSlot | null;
  /** 이 장소의 도시 — 대체 장소 직접 추가의 검색 범위 */
  city: City | null;
  onMemo: (memo: Memo | null) => void;
  /** 「추가」 줄의 「비용」 — 이 일정에 연결된 새 비용 */
  onExpense: () => void;
  /** 바우처 칸 · 칩 — 「추가」 줄의 바우처 칩(누르면 바로 파일을 골라 만든다)을 여기서 쓴다. 대체 장소의 상세에서는 null */
  vouchers: DetailVoucherSlot | null;
};

/**
 * 상세 본문 아래쪽 — 대체 장소 칸(있을 때만) · 「대체 장소 추가」 창 · 맨 아래 「추가」 줄(빈 칸의 칩: 비용 · 바우처 · 메모 · 대체 장소).
 * 칸의 「+」 와 「추가」 줄 칩이 같은 창을 열어서 창 상태를 여기서 쥔다
 */
export function DetailExtras({
  tripId,
  row,
  alternatives: alt,
  city,
  onMemo,
  onExpense,
  vouchers: voucherSlot,
}: DetailExtrasProps) {
  const { data: memos = [] } = useMemos(tripId);
  const { data: expenses = [] } = useExpenses(tripId);
  const { data: vouchers = [] } = useVouchers(tripId);
  const [picking, setPicking] = useState(false);
  const item = row.item;
  const hasMemos = memos.some((m) => m.schedule_item_id === item.id);
  const hasExpenses = expenses.some((e) => e.schedule_item_id === item.id);
  const altChip = !!alt && row.alternatives.length === 0;
  return (
    <>
      {alt && (
        <>
          <AlternativesBlock
            tripId={tripId}
            main={item}
            alternatives={row.alternatives}
            actions={alt.actions}
            onAdd={() => setPicking(true)}
            onOpen={alt.onOpen}
          />
          <AlternativePickerDialog
            open={picking}
            onClose={() => setPicking(false)}
            tripId={tripId}
            main={item}
            alternatives={row.alternatives}
            actions={alt.actions}
            onDirectAdd={() => alt.onAdd(city)}
          />
        </>
      )}
      <ExtraChips
        expense={hasExpenses ? null : onExpense}
        voucher={
          voucherSlot && cardVouchers(vouchers, item).length === 0
            ? voucherSlot.renderChip(item)
            : null
        }
        memo={hasMemos ? null : () => onMemo(null)}
        alternative={altChip ? () => setPicking(true) : null}
      />
      {alt?.actions.error && <p className="text-[13px] text-destructive">{alt.actions.error}</p>}
    </>
  );
}

type ExtraChipsProps = {
  /** 빈 칸마다 칩을 누르면 할 일 — 값이 있는 칸은 null */
  expense: (() => void) | null;
  /** 바우처 칩(화면이 그린 것) */
  voucher: ReactNode;
  memo: (() => void) | null;
  alternative: (() => void) | null;
};

/** 맨 아래 「추가」 줄 — 비용 · 바우처 · 메모 · 대체 장소 순. 칩이 하나도 없으면 줄을 그리지 않는다 */
function ExtraChips({ expense, voucher, memo, alternative }: ExtraChipsProps) {
  if (!expense && !voucher && !memo && !alternative) return null;
  return (
    <AddChipRow>
      {expense && <AddChip icon={Receipt} label="비용" onClick={expense} />}
      {voucher}
      {memo && <AddChip icon={NotebookPen} label="메모" onClick={memo} />}
      {alternative && <AddChip icon={MapPin} label="대체 장소" onClick={alternative} />}
    </AddChipRow>
  );
}
