"use client";

import { useSortable } from "@dnd-kit/react/sortable";
import { Check, Equal, GripVertical, Lock } from "lucide-react";

import { itemName, ReservationBadge, type TimelineRow } from "@/entities/schedule-item";
import { cn } from "@/shared/lib/utils";

type EditRowProps = {
  row: TimelineRow;
  index: number;
  selected: boolean;
  /** 고를 수 있는지(항공편은 잠금) */
  selectable: boolean;
  onToggle: () => void;
  /** PC 는 오른쪽에 시간을 보이고 손잡이가 세로 점 */
  layout: "mobile" | "pc";
};

/** 레이아웃별 손잡이 */
const LAYOUT = {
  mobile: {
    row: "py-1.5 pr-4 pl-5",
    card: "py-3.5",
    Grip: Equal,
    grip: "h-11 w-9",
    gripIcon: "size-6",
  },
  pc: {
    row: "py-1.25 pr-3 pl-5",
    card: "py-3",
    Grip: GripVertical,
    grip: "h-10 w-8 rounded-button hover:bg-surface-muted",
    gripIcon: "size-5",
  },
};

/**
 * 편집 목록 한 줄 — 왼쪽 선택 원(항공편은 회색 자물쇠), 짧은 카드(번호 · 이름 · 상태 · 한 줄 설명), 오른쪽 끌기 손잡이.
 * 카드를 누르면 상세가 아니라 선택만 바뀐다. 손잡이로만 끈다(터치는 길게 눌러서, 키보드는 손잡이에서 스페이스)
 */
export function EditRow({ row, index, selected, selectable, onToggle, layout }: EditRowProps) {
  const look = LAYOUT[layout];
  const { ref, handleRef, isDragging } = useSortable({ id: row.item.id, index });
  const name = itemName(row.item);
  return (
    <div
      ref={ref}
      className={cn("relative flex items-center gap-3", look.row, isDragging && "z-10")}
    >
      <SelectCircle name={name} selected={selected} selectable={selectable} onToggle={onToggle} />
      <button
        type="button"
        tabIndex={-1}
        disabled={!selectable}
        onClick={onToggle}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2.5 rounded-card border bg-white px-4 text-left transition-shadow",
          look.card,
          selected ? "border-primary" : "border-line-card",
          isDragging ? "scale-[1.02] shadow-[0_10px_24px_rgba(0,0,0,0.16)]" : "shadow-card",
        )}
      >
        {row.num !== null && (
          <span className="flex size-5.5 shrink-0 items-center justify-center rounded-full bg-line-strong text-xs font-bold text-white">
            {row.num}
          </span>
        )}
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-[15px] font-bold text-ink-900">
              {row.emoji && <span className="mr-1 font-normal">{row.emoji}</span>}
              {name}
            </span>
            {row.status && <ReservationBadge status={row.status} className="shrink-0" />}
          </span>
          {(row.kind === "flight" || row.meta) && (
            <span className="truncate text-[13px] text-ink-400">
              {row.kind === "flight" ? "항공편 화면에서 수정·삭제" : row.meta}
            </span>
          )}
        </span>
        {layout === "pc" && row.time && (
          <span className="shrink-0 text-[13px] font-semibold text-ink-400">{row.time}</span>
        )}
      </button>
      <button
        ref={handleRef}
        type="button"
        aria-label={`${name} 순서 옮기기`}
        className={cn(
          "flex shrink-0 cursor-grab touch-none items-center justify-center text-ink-350",
          look.grip,
        )}
      >
        <look.Grip className={look.gripIcon} />
      </button>
    </div>
  );
}

type SelectCircleProps = {
  name: string;
  selected: boolean;
  selectable: boolean;
  onToggle: () => void;
};

/** 선택 원 — 고르면 파랑 + ✓, 항공편은 회색 자물쇠(고를 수 없다) */
function SelectCircle({ name, selected, selectable, onToggle }: SelectCircleProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      aria-label={selectable ? `${name} 선택` : `${name} — 항공편은 항공편 화면에서 고쳐요`}
      disabled={!selectable}
      onClick={onToggle}
      className={cn(
        "flex size-6.5 shrink-0 items-center justify-center rounded-full border",
        !selectable && "border-line bg-surface-muted",
        selectable && (selected ? "border-primary bg-primary" : "border-handle bg-white"),
      )}
    >
      {selected && <Check className="size-3.5 text-white" strokeWidth={3} />}
      {!selectable && <Lock className="size-3 text-ink-350" />}
    </button>
  );
}
