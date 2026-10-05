import { CircleAlert } from "lucide-react";

import { cn } from "@/shared/lib/utils";

import type { TimelineRow } from "../../lib/timeline";
import type { MemoAuthor } from "../../model/memo";
import { itemName } from "../../model/place";
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
  authorOf: (authorId: string | null) => MemoAuthor | null;
};

/**
 * place · flight · note 의 카드.
 * 카드 어디를 눌러도 상세가 열린다. 제목 버튼을 카드 전체로 늘리고(after:inset-0), 링크 · 메모 토글처럼
 * 따로 동작하는 것과 펼친 메모 본문(무반응)은 relative 로 그 위에 올린다.
 * 식사(food)는 배경 대신 오른쪽 위 64px 사진 칸(지금은 🍽️ 자리표시)을 두고 제목 · 설명이 그 자리를 비운다.
 */
export function ItemCard({ row, open, onToggle, onOpen, authorOf }: ItemCardProps) {
  return (
    <div
      className={cn(
        "relative flex min-w-0 flex-1 flex-col gap-1.5 rounded-card border border-line-card bg-white px-4.5 py-4 shadow-card",
        // 내용이 짧아도 64px 사진 칸(위아래 여백 16 포함 96)이 카드 밖으로 나가지 않게
        row.isMeal && "min-h-24",
      )}
    >
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
        {itemName(row.item)}
      </button>
      {row.meta && <p className={cn("text-sm text-ink-400", row.isMeal && "pr-19")}>{row.meta}</p>}
      <AlternativesLine alternatives={row.alternatives} />
      <LinkChips links={row.links} />
      {/* 그날 휴무는 메모를 접어도 보이게 칩으로 — 펼친 메모 칸의 「운영 …」 은 영업하는 날만 */}
      {row.hoursOff && (
        <p className="relative inline-flex h-6 items-center gap-1 self-start rounded-pill-sm bg-destructive-soft px-2 text-xs font-extrabold text-destructive">
          <CircleAlert className="size-3.25" strokeWidth={2.4} />
          {row.hours}
        </p>
      )}
      <MemoSection
        memos={row.memos}
        hours={row.hoursOff ? null : row.hours}
        open={open}
        onToggle={onToggle}
        authorOf={authorOf}
      />
    </div>
  );
}
