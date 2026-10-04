import { cn } from "@/shared/lib/utils";

import type { TimelineRow } from "../../lib/timeline";
import { ReservationBadge } from "../reservation-badge";
import { AlternativesLine } from "./alternatives-line";
import { LinkChips } from "./link-chips";
import { MemoSection } from "./memo-section";

const TITLE_SIZE = {
  place: "text-[17px] font-bold",
  flight: "text-xl font-bold",
  note: "text-[15px] font-medium",
} satisfies Record<TimelineRow["kind"], string>;

type ItemCardProps = {
  row: TimelineRow;
  open: boolean;
  onToggle: () => void;
  onOpen: () => void;
};

/**
 * place · flight · note 의 카드.
 * 카드 어디를 눌러도 상세가 열린다. 제목 버튼을 카드 전체로 늘리고(after:inset-0), 링크 · 메모 토글처럼
 * 따로 동작하는 것과 펼친 메모 본문(무반응)은 relative 로 그 위에 올린다.
 * 식사(food)는 배경 대신 오른쪽 위 64px 사진 칸(지금은 🍽️ 자리표시)을 두고 제목 · 설명이 그 자리를 비운다.
 */
export function ItemCard({ row, open, onToggle, onOpen }: ItemCardProps) {
  return (
    <div className="relative flex min-w-0 flex-1 flex-col gap-1.5 rounded-card border border-line-card bg-white px-4.5 py-4 shadow-card">
      {row.isMeal && (
        <span
          aria-hidden="true"
          className="absolute top-4 right-4.5 flex size-16 items-center justify-center rounded-memo bg-surface-muted text-3xl"
        >
          🍽️
        </span>
      )}
      {row.status && <ReservationBadge status={row.status} className="mb-0.5" />}
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          "text-left leading-snug tracking-[-0.01em] text-pretty text-ink-900 after:absolute after:inset-0 after:rounded-card",
          TITLE_SIZE[row.kind],
          row.isMeal && "pr-19",
        )}
      >
        {row.emoji && <span className="mr-1.5 font-normal">{row.emoji}</span>}
        {row.item.name}
      </button>
      {row.meta && <p className={cn("text-sm text-ink-400", row.isMeal && "pr-19")}>{row.meta}</p>}
      <AlternativesLine alternatives={row.alternatives} />
      <LinkChips links={row.links} />
      <MemoSection notes={row.notes} hours={row.hours} open={open} onToggle={onToggle} />
    </div>
  );
}
