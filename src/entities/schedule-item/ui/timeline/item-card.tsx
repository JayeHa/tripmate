import { CircleAlert, ListTodo, Ticket } from "lucide-react";
import Link from "next/link";

import { NAV } from "@/shared/lib/nav-transition";
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
  // 날짜 메모는 여러 줄 글이라 줄바꿈을 살린다
  note: "text-[15px] font-medium whitespace-pre-line",
} satisfies Record<TimelineRow["kind"], string>;

type ItemCardProps = {
  row: TimelineRow;
  open: boolean;
  onToggle: () => void;
  onOpen: () => void;
  authorOf: (authorId: string | null) => MemoAuthor | null;
  /** 끝나지 않은 체크리스트 수와 노트 체크리스트 주소 — 수가 0 이거나 없으면 칩을 그리지 않는다 */
  checklist?: { count: number; href: string };
  /** 이 카드의 바우처 수와 누르면 할 일(하나면 뷰어, 여럿이면 상세) — 수가 0 이거나 없으면 칩을 그리지 않는다 */
  vouchers?: { count: number; onOpen: () => void };
};

/**
 * place · flight · note 의 카드.
 * 카드 어디를 눌러도 상세가 열린다. 제목 버튼을 카드 전체로 늘리고(after:inset-0), 링크 · 메모 토글처럼
 * 따로 동작하는 것과 펼친 메모 본문(무반응)은 relative 로 그 위에 올린다.
 * 식사(food)는 배경 대신 오른쪽 위 64px 사진 칸(지금은 🍽️ 자리표시)을 두고 제목 · 설명이 그 자리를 비운다.
 * 숙소에 연결된 카드는 같은 자리에 🛏️ — 「자세히」(64 + 아래 체크인 | 체크아웃 줄) · 「간략히」(40 · 낮은 카드 · 설명 대신 「숙박 2/3박 …」)
 */
export function ItemCard({
  row,
  open,
  onToggle,
  onOpen,
  authorOf,
  checklist,
  vouchers,
}: ItemCardProps) {
  const look = lookOf(row);
  return (
    <div
      className={cn(
        "relative flex min-w-0 flex-1 flex-col rounded-card border border-line-card bg-white px-4.5 shadow-card",
        look.card,
      )}
    >
      {look.photo && (
        <span
          aria-hidden="true"
          className={cn(
            "absolute right-4.5 flex items-center justify-center rounded-memo bg-surface-muted",
            look.photoBox,
          )}
        >
          {look.photo}
        </span>
      )}
      {row.status && <ReservationBadge status={row.status} className="mb-0.5" />}
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          "text-left leading-snug tracking-[-0.01em] text-pretty text-ink-900 after:absolute after:inset-0 after:rounded-card",
          look.title,
          look.pad,
        )}
      >
        {row.emoji && <span className="mr-1.5 font-normal">{row.emoji}</span>}
        {itemName(row.item)}
      </button>
      {look.meta && <p className={cn("text-sm text-ink-400", look.pad)}>{look.meta}</p>}
      {row.stay?.mode === "in" && <StayTimes inText={row.stay.inText} outText={row.stay.outText} />}
      <NoteChips checklist={checklist} vouchers={vouchers} />
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

/**
 * 카드 모양 — 숙소 「간략히」 는 낮은 카드(위아래 14 · 제목 16 · 🛏️ 40 · 설명 대신 숙박 줄),
 * 숙소 「자세히」 · 식사는 오른쪽 위 64 사진 칸(제목 · 설명이 그 자리를 비운다), 그 밖은 기본.
 * 내용이 짧아도 사진 칸(위아래 여백 포함)이 카드 밖으로 나가지 않게 최소 높이를 둔다
 */
function lookOf(row: TimelineRow) {
  if (row.stay?.mode === "mid") {
    return {
      card: "gap-1 py-3.5 min-h-17",
      photo: "🛏️",
      photoBox: "top-3.5 size-10 text-xl",
      title: "text-base font-bold",
      pad: "pr-13",
      meta: row.stay.line,
    };
  }
  const photo = photoOf(row);
  return {
    card: cn("gap-1.5 py-4", photo && "min-h-24"),
    photo,
    photoBox: "top-4 size-16 text-3xl",
    title: TITLE_SIZE[row.kind],
    pad: photo ? "pr-19" : undefined,
    meta: row.meta,
  };
}

/** 오른쪽 위 사진 칸 — 숙소 카드는 🛏️, 식사는 🍽️, 그 밖은 없음 */
function photoOf(row: TimelineRow): string | null {
  if (row.stay) return "🛏️";
  return row.isMeal ? "🍽️" : null;
}

type StayTimesProps = { inText: string; outText: string };

/** 숙소 「자세히」 의 체크인 | 체크아웃 2칸 줄(#F7F8FA · r10) */
function StayTimes({ inText, outText }: StayTimesProps) {
  return (
    <div className="mt-1.5 grid grid-cols-[1fr_1px_1fr] items-center rounded-memo bg-surface-sunken py-2.5">
      <span className="flex flex-col items-center gap-0.5">
        <span className="text-xs text-ink-350">체크인</span>
        <span className="text-[15px] font-extrabold text-ink-900">{inText}</span>
      </span>
      <span aria-hidden="true" className="h-7 bg-line" />
      <span className="flex flex-col items-center gap-0.5">
        <span className="text-xs text-ink-350">체크아웃</span>
        <span className="text-[15px] font-extrabold text-ink-900">{outText}</span>
      </span>
    </div>
  );
}

type NoteChipsProps = Pick<ItemCardProps, "checklist" | "vouchers">;

/** 노트 칩 줄(24 · r12 · 12/700) — 「체크리스트 N」(주황, 노트로) · 「바우처 N」(파랑). 둘 다 없으면 그리지 않는다 */
function NoteChips({ checklist, vouchers }: NoteChipsProps) {
  const showChecklist = !!checklist && checklist.count > 0;
  const showVouchers = !!vouchers && vouchers.count > 0;
  if (!showChecklist && !showVouchers) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {showChecklist && (
        <Link
          href={checklist.href}
          transitionTypes={NAV.tab}
          className="relative inline-flex h-6 items-center gap-1 rounded-full bg-checklist-due-bg px-2 text-xs font-bold text-checklist-due"
        >
          <ListTodo className="size-3.25" aria-hidden="true" />
          체크리스트 {checklist.count}
        </Link>
      )}
      {showVouchers && (
        <button
          type="button"
          onClick={vouchers.onOpen}
          className="relative inline-flex h-6 items-center gap-1 rounded-full bg-surface-selected px-2 text-xs font-bold text-brand-text"
        >
          <Ticket className="size-3.25" strokeWidth={2.2} aria-hidden="true" />
          바우처 {vouchers.count}
        </button>
      )}
    </div>
  );
}
