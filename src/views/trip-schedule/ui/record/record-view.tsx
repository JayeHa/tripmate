"use client";

import { ChevronLeft, X } from "lucide-react";

import { ratingText, type VisitPhoto } from "@/entities/schedule-item";
import { useHeldWhileClosing } from "@/shared/lib/use-dialog-state";
import { cn } from "@/shared/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";

import type { CrewMember, RatingBoard as Board } from "../../lib/crew";
import { RatingBoard, Stars } from "./rating-board";
import { RecordViewPhotos } from "./record-view-photos";

/** 자세히 보기를 연 장소 — 머리 글과 일행이 함께 쓴 기록 */
export type RecordViewTarget = {
  itemId: string;
  /** 「🍜 이치란 시부야점」 */
  title: string;
  /** 「11.2 (월) · 10:52 도착」 */
  sub: string;
  /** 사람마다의 별점. 혼자 여행이면 null — 박스 대신 내 별점 한 줄(stars)을 그린다 */
  board: Board | null;
  /** 내 별점(0 = 안 매김). 혼자 여행일 때만 쓴다 */
  stars: number;
  body: string;
  /** 글을 마지막으로 고친 사람의 이름. 혼자 여행이거나 모르면(나간 사람 · 지운 계정) null */
  editor: string | null;
  photos: readonly VisitPhoto[];
};

type RecordViewProps = {
  tripId: string;
  /** 연 장소. null 이면 닫힌다 */
  target: RecordViewTarget | null;
  /** 사진을 올린 사람 — 혼자 여행이면 늘 null */
  uploader: (userId: string | null) => CrewMember | null;
  onClose: () => void;
  /** 「수정」 — 기록 창으로 */
  onEdit: (itemId: string) => void;
};

/**
 * 기록 자세히 보기 — 읽기용. 모바일은 일정 위 전체 화면(위 막대 ‹ · 「기록」 · 「수정」), PC 는 가운데 560 창(머리에 제목 · 「수정」 · ✕).
 * 내용은 제목 · 도착 줄 → 별점 박스(사람마다 한 줄) → 기록 글 전문 · 마지막으로 고친 사람 → 사진을 폭 그대로 한 장씩.
 * 열어 둔 동안 일행이 고치면 그대로 따라 바뀐다(고치는 창이 아니라 붙잡아 둘 값이 없다). 고치기는 「수정」 → 기록 창
 */
export function RecordView({ tripId, target, uploader, onClose, onEdit }: RecordViewProps) {
  const open = target !== null;
  const shown = useHeldWhileClosing(open, target);
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="inset-0 flex h-dvh w-full max-w-none translate-0 flex-col gap-0 overflow-hidden rounded-none bg-white p-0 ring-0 sm:max-w-none lg:inset-auto lg:top-1/2 lg:left-1/2 lg:h-auto lg:max-h-[calc(100dvh-64px)] lg:w-140 lg:max-w-140 lg:-translate-1/2 lg:rounded-[16px] lg:shadow-[0_12px_40px_rgba(0,0,0,.2)]"
      >
        {shown && (
          <>
            <MobileTop onClose={onClose} onEdit={() => onEdit(shown.itemId)} />
            <PcHead target={shown} onClose={onClose} onEdit={() => onEdit(shown.itemId)} />
            <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 pt-5 pb-12 lg:px-6 lg:pb-7">
              <div className="lg:hidden">
                <Summary target={shown} />
              </div>
              {shown.board && <RatingBoard board={shown.board} />}
              {shown.body && (
                <Note body={shown.body} editor={shown.editor} divided={shown.photos.length > 0} />
              )}
              <RecordViewPhotos tripId={tripId} photos={shown.photos} uploader={uploader} />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

type ActionProps = { onClose: () => void; onEdit: () => void };

/** 모바일 위 막대 52 — ‹ · 「기록」 · 오른쪽 「수정」 */
function MobileTop({ onClose, onEdit }: ActionProps) {
  return (
    <div className="shrink-0 border-b border-line-card pt-[env(safe-area-inset-top)] lg:hidden">
      <div className="flex h-13 items-center gap-1 px-2">
        <button
          type="button"
          aria-label="닫기"
          onClick={onClose}
          className="flex size-8.5 items-center justify-center text-ink-900"
        >
          <ChevronLeft className="size-6" strokeWidth={2} />
        </button>
        <DialogTitle className="flex-1 text-[17px] font-extrabold text-ink-900">기록</DialogTitle>
        <button
          type="button"
          onClick={onEdit}
          className="px-3 py-2 text-[15px] font-bold text-primary"
        >
          수정
        </button>
      </div>
    </div>
  );
}

type PcHeadProps = ActionProps & { target: RecordViewTarget };

/** PC 머리 — 제목 · 도착 줄 + 「수정」(32 · 테두리) · ✕ */
function PcHead({ target, onClose, onEdit }: PcHeadProps) {
  return (
    <div className="hidden shrink-0 items-start gap-3 border-b border-line-card px-6 pt-6 pb-4 lg:flex">
      <div className="min-w-0 flex-1">
        <Summary target={target} pc />
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="h-8 shrink-0 rounded-button border border-line px-3 text-[13px] font-bold text-ink-700 hover:bg-surface-muted"
      >
        수정
      </button>
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="-mr-1.5 flex size-8 shrink-0 items-center justify-center text-ink-400"
      >
        <X className="size-5.5" strokeWidth={2} />
      </button>
    </div>
  );
}

type SummaryProps = { target: RecordViewTarget; pc?: boolean };

/**
 * 제목 21/800 · 도착 줄 13. 혼자 여행이면 그 아래 내 별점 한 줄(별 20, PC 18 + 문구) — 안 매겼으면 없다.
 * 일행이 있으면 별점은 박스가 그린다. 모바일의 창 제목은 위 막대의 「기록」 이라 여기는 PC 에서만 창 제목이다
 */
function Summary({ target, pc = false }: SummaryProps) {
  const Title = pc ? DialogTitle : "h3";
  const text = target.board ? null : ratingText(target.stars);
  return (
    <div className="flex flex-col gap-1.5">
      <Title className="text-[21px]/[1.3] font-extrabold tracking-[-.02em] wrap-break-word text-ink-900">
        {target.title}
      </Title>
      <p className="text-[13px] text-route-sub">{target.sub}</p>
      {text && (
        <div className="flex items-center gap-2 pt-0.5">
          <Stars stars={target.stars} className={pc ? "text-lg" : "text-xl"} />
          <span className="text-[13px] font-extrabold text-my-star-text">{text}</span>
        </div>
      )}
    </div>
  );
}

type NoteProps = {
  body: string;
  editor: string | null;
  /** 아래에 사진이 이어진다 — 모바일은 구분선을 긋는다 */
  divided: boolean;
};

/** 기록 글 전문(줄바꿈 그대로) + 「○○님이 마지막으로 고쳤어요」 */
function Note({ body, editor, divided }: NoteProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        divided && "border-b border-line-card pb-5 lg:border-b-0 lg:pb-0",
      )}
    >
      <p className="text-[15px]/[1.65] wrap-break-word whitespace-pre-wrap text-ink-800">{body}</p>
      {editor && <p className="text-xs text-route-card-meta">{editor}님이 마지막으로 고쳤어요</p>}
    </div>
  );
}
