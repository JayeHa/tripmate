"use client";

import { X } from "lucide-react";
import { useState } from "react";

import { nextStars, RatingPicker, VISIT_NOTE_MAX } from "@/entities/schedule-item";
import { useHeldWhileClosing, useOpenCount } from "@/shared/lib/use-dialog-state";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";

/** 기록 창을 연 장소 — 머리 글과 지금 값 */
export type RecordTarget = {
  itemId: string;
  /** 「🍜 이치란 · 11.2 (월) 10:52 도착」 */
  caption: string;
  /** 내 별점(0 = 안 매김) */
  stars: number;
  /** 내 기록 글(없으면 "") */
  body: string;
};

/** 저장할 값 */
export type RecordDraft = { stars: number; body: string };

type RecordDialogProps = {
  /** 연 장소. null 이면 닫힌다 */
  target: RecordTarget | null;
  onClose: () => void;
  onSave: (itemId: string, draft: RecordDraft) => void;
};

/**
 * 기록 창 — 모바일 바텀시트(최대 88%) · PC 가운데 480 모달. 본문은 별점 → 기록 글(200자) 순서이고 하단에 「취소」 · 「저장」.
 * 저장은 오프라인 대기열로 올라가 바로 닫힌다. 취소 · 바깥 누르기는 바꾼 것을 버린다(별점도 저장할 때만 반영).
 * 열 때마다 지금 값에서 다시 시작한다
 */
export function RecordDialog({ target, onClose, onSave }: RecordDialogProps) {
  const open = target !== null;
  const shown = useHeldWhileClosing(open, target);
  const openCount = useOpenCount(open);
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="top-auto bottom-0 left-0 flex max-h-[88dvh] w-full max-w-none translate-0 flex-col gap-0 overflow-hidden rounded-none rounded-t-sheet bg-white p-0 ring-0 sm:max-w-none lg:top-1/2 lg:bottom-auto lg:left-1/2 lg:max-h-[calc(100dvh-80px)] lg:w-120 lg:max-w-120 lg:-translate-1/2 lg:rounded-[16px] lg:shadow-[0_12px_40px_rgba(0,0,0,.2)]"
      >
        {shown && (
          <RecordForm
            key={openCount}
            target={shown}
            onClose={onClose}
            onSave={(draft) => {
              onSave(shown.itemId, draft);
              onClose();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

type RecordFormProps = {
  target: RecordTarget;
  onClose: () => void;
  onSave: (draft: RecordDraft) => void;
};

/** 창 안 — 머리 · 별점 · 기록 글 · 하단 버튼 */
function RecordForm({ target, onClose, onSave }: RecordFormProps) {
  const [stars, setStars] = useState(target.stars);
  const [body, setBody] = useState(target.body);
  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ stars, body });
      }}
    >
      <span
        aria-hidden
        className="mx-auto mt-2 h-1 w-9 shrink-0 rounded-full bg-[#ddd] lg:hidden"
      />
      <div className="flex shrink-0 items-start gap-3 px-5 pt-4 pb-1 lg:px-6 lg:pt-6">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <DialogTitle className="text-lg font-extrabold text-ink-900 lg:text-[19px]">
            {target.body ? "기록 수정" : "기록 남기기"}
          </DialogTitle>
          <p className="truncate text-[13px] text-route-sub">{target.caption}</p>
        </div>
        <button
          type="button"
          aria-label="닫기"
          onClick={onClose}
          className="-mr-1.5 flex size-8 shrink-0 items-center justify-center text-ink-400"
        >
          <X className="size-5.5" strokeWidth={2} />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-5.5 overflow-y-auto px-5 pt-3.5 pb-4 lg:px-6">
        <Block label="별점">
          <RatingPicker
            value={stars}
            onPick={(n) => setStars(nextStars(stars, n))}
            size="sheet"
            emptyText="눌러서 매겨요"
            label="별점"
          />
        </Block>
        <Block label="기록" htmlFor="record-body">
          <div className="flex flex-col gap-1">
            <textarea
              id="record-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={VISIT_NOTE_MAX}
              rows={4}
              placeholder="예: 줄 40분. 붕장어 텐동 압승 🍤 다음엔 평일 오전에 오기"
              className="min-h-27 w-full resize-none rounded-card border border-line px-3.5 py-3 text-[15px]/normal text-ink-900 outline-none placeholder:text-ink-350 focus:border-primary"
            />
            <span className="self-end text-xs text-ink-350 tabular-nums">
              {body.length} / {VISIT_NOTE_MAX}
            </span>
          </div>
        </Block>
      </div>
      <div className="flex shrink-0 gap-2 border-t border-divider px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:justify-end lg:border-t-0 lg:px-6 lg:pt-4 lg:pb-5">
        <Button
          type="button"
          variant="chip"
          size="cta"
          className="lg:h-10.5 lg:min-w-22 lg:text-[15px]"
          onClick={onClose}
        >
          취소
        </Button>
        <Button
          type="submit"
          size="cta"
          className="flex-1 lg:h-10.5 lg:min-w-22 lg:flex-none lg:text-[15px]"
        >
          저장
        </Button>
      </div>
    </form>
  );
}

const LABEL = "text-[13px] font-bold text-ink-700";

type BlockProps = { label: string; htmlFor?: string; children: React.ReactNode };

/** 본문 한 덩이 — 라벨 13/700 + 내용, 사이 8. 입력 칸이 하나면 라벨을 그 칸에 잇는다 */
function Block({ label, htmlFor, children }: BlockProps) {
  return (
    <div className="flex flex-col gap-2">
      {htmlFor ? (
        <label htmlFor={htmlFor} className={LABEL}>
          {label}
        </label>
      ) : (
        <span className={LABEL}>{label}</span>
      )}
      {children}
    </div>
  );
}
