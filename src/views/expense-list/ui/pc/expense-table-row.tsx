import { MapPin, StickyNote } from "lucide-react";

import {
  amountLines,
  ExpenseBadge,
  ExpenseCategoryTile,
  type ExpenseRowView,
  type PersonRef,
  withLine,
} from "@/entities/expense";
import { cn } from "@/shared/lib/utils";

import type { AmountMode } from "../../model/use-pc-list";
import { TABLE_COLUMNS } from "./columns";

type ExpenseTableRowProps = {
  row: ExpenseRowView;
  /** 줄을 눌렀다 — 수정 창을 연다 */
  onOpen: () => void;
  onMarkPaid: () => void;
  /** 결제 완료로 바꾸는 중 */
  paying: boolean;
  mode: AmountMode;
  displayNameOf: (person: PersonRef) => string;
  everyone: number;
};

/** 아바타 색 — 각자 냄(사람 없음)은 잉크, 정산 인원은 분홍, 멤버는 블루 */
function avatarTone(person: PersonRef | null) {
  if (!person) return "bg-ink-900";
  return person.kind === "guest" ? "bg-guest" : "bg-primary";
}

/**
 * PC 가계부 표 한 줄 — 카테고리 타일 28 + 이름 | 항목(배지 · 메모 아이콘, 아래 예정일 지남이나 연결 일정) |
 * 결제 · 함께 두 줄(아바타 18 + 「정원 결제」, 「함께 · 동규, 서연」) | 결제수단 | 금액(현지 금액 / 원화). 합계에서 뺀 비용은 흐리다
 */
export function ExpenseTableRow({
  row,
  onOpen,
  onMarkPaid,
  paying,
  mode,
  displayNameOf,
  everyone,
}: ExpenseTableRowProps) {
  const amount = amountLines(row, mode);
  const payer = row.splitEach ? null : row.payer;
  const avatarPerson = payer?.person ?? null;
  return (
    <div
      className={cn(
        "relative py-2.75 hover:bg-[#FAFBFC]",
        TABLE_COLUMNS,
        row.excluded && "opacity-55",
      )}
    >
      <span className="flex min-w-0 items-center gap-2">
        <ExpenseCategoryTile category={row.category} size="sm" />
        <span className="text-[13px] font-semibold text-ink-700">{row.categoryLabel}</span>
      </span>
      <div className="flex min-w-0 flex-col gap-0.75">
        <div className="flex min-w-0 items-center gap-1.5">
          {row.planned && <ExpenseBadge>결제 예정</ExpenseBadge>}
          <button
            type="button"
            onClick={onOpen}
            className="min-w-0 truncate text-left text-sm font-semibold text-ink-800 after:absolute after:inset-0"
          >
            {row.name}
          </button>
          {row.hasMemo && (
            <StickyNote className="size-3.25 shrink-0 text-ink-350" aria-label="메모 있음" />
          )}
          {row.excluded && <ExpenseBadge>합계 제외</ExpenseBadge>}
        </div>
        {row.overdue ? (
          <span className="flex items-center gap-1.5 text-xs whitespace-nowrap text-status-wait-text">
            예정일 지남
            <button
              type="button"
              onClick={onMarkPaid}
              disabled={paying}
              className="relative z-10 flex h-5 items-center rounded-memo border border-status-wait-line bg-white px-2 text-[11px] font-semibold disabled:opacity-50"
            >
              결제 완료로
            </button>
          </span>
        ) : (
          row.linkName && (
            <span className="flex min-w-0 items-center gap-0.75 text-xs text-ink-400">
              <MapPin className="size-2.75 shrink-0 text-ink-350" aria-hidden="true" />
              <span className="truncate">{row.linkName}</span>
            </span>
          )
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-0.75">
        <span className="flex min-w-0 items-center gap-1.5">
          <span
            className={cn(
              "flex size-4.5 shrink-0 items-center justify-center rounded-full text-[8px] font-extrabold text-white",
              avatarTone(avatarPerson),
            )}
          >
            {avatarPerson ? displayNameOf(avatarPerson).slice(0, 1) : "각"}
          </span>
          <span className="truncate text-[13px] font-semibold text-ink-800">
            {payer ? `${displayNameOf(payer.person)} 결제` : "각자 냄"}
          </span>
        </span>
        <span className="truncate pl-6 text-xs text-ink-400">
          {withLine(row, displayNameOf, everyone)}
        </span>
      </div>
      <span className="text-[13px] text-ink-500">{row.methodLabel}</span>
      <div className="flex flex-col items-end gap-0.5">
        <span
          className={cn(
            "text-[15px] font-extrabold",
            row.excluded ? "text-ink-350 line-through" : "text-ink-900",
          )}
        >
          {amount.big}
        </span>
        {amount.small && <span className="text-[11px] text-ink-400">{amount.small}</span>}
      </div>
    </div>
  );
}
