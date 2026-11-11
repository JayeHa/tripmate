"use client";

import { X } from "lucide-react";
import { useState } from "react";

import {
  nextStars,
  RatingPicker,
  useVisitPhotoUrls,
  VISIT_NOTE_MAX,
  VISIT_PHOTO_LIMIT,
  type VisitPhoto,
} from "@/entities/schedule-item";
import { useHeldWhileClosing, useOpenCount, useReportLock } from "@/shared/lib/use-dialog-state";
import { useOnline } from "@/shared/lib/use-online";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";

import { useRecordPhotos } from "../../model/use-record-photos";
import { PhotoPicker } from "./photo-picker";
import { RecordBlock } from "./record-block";

/** 기록 창을 연 장소 — 머리 글과 지금 값 */
export type RecordTarget = {
  itemId: string;
  /** 「🍜 이치란 · 11.2 (월) 10:52 도착」 */
  caption: string;
  /** 내 별점(0 = 안 매김) */
  stars: number;
  /** 내 기록 글(없으면 "") */
  body: string;
  /** 내 기록 사진(순서대로) */
  photos: readonly VisitPhoto[];
};

/** 저장할 값 */
export type RecordDraft = { stars: number; body: string };

type RecordDialogProps = {
  tripId: string;
  /** 연 장소. null 이면 닫힌다 */
  target: RecordTarget | null;
  onClose: () => void;
  onSave: (itemId: string, draft: RecordDraft) => void;
};

/**
 * 기록 창 — 모바일 바텀시트(최대 88%) · PC 가운데 480 모달. 본문은 별점 → 기록 글(200자) → 사진(10장 · 사진별 설명) 순서이고
 * 하단에 「취소」 · 「저장」. 취소 · 바깥 누르기는 바꾼 것을 버린다(별점도 저장할 때만 반영). 열 때마다 지금 값에서 다시 시작한다.
 * 별점 · 글은 오프라인 대기열로 올라간다. 사진을 바꿨으면 먼저 올리고(그동안 창을 닫지 못한다), 실패하면 창에 문구를 두고 다시 저장하게 한다
 */
export function RecordDialog({ tripId, target, onClose, onSave }: RecordDialogProps) {
  const open = target !== null;
  const shown = useHeldWhileClosing(open, target);
  const openCount = useOpenCount(open);
  const [locked, setLocked] = useState(false);
  return (
    <Dialog open={open} locked={locked} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="top-auto bottom-0 left-0 flex max-h-[88dvh] w-full max-w-none translate-0 flex-col gap-0 overflow-hidden rounded-none rounded-t-sheet bg-white p-0 ring-0 sm:max-w-none lg:top-1/2 lg:bottom-auto lg:left-1/2 lg:max-h-[calc(100dvh-80px)] lg:w-120 lg:max-w-120 lg:-translate-1/2 lg:rounded-[16px] lg:shadow-[0_12px_40px_rgba(0,0,0,.2)]"
      >
        {shown && (
          <RecordForm
            key={openCount}
            tripId={tripId}
            target={shown}
            onLockChange={setLocked}
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
  tripId: string;
  target: RecordTarget;
  onLockChange: (locked: boolean) => void;
  onClose: () => void;
  onSave: (draft: RecordDraft) => void;
};

/** 창 안 — 머리 · 별점 · 기록 글 · 사진 · 하단 버튼 */
function RecordForm({ tripId, target, onLockChange, onClose, onSave }: RecordFormProps) {
  const [stars, setStars] = useState(target.stars);
  const [body, setBody] = useState(target.body);
  const [error, setError] = useState<string | null>(null);
  const photos = useRecordPhotos(tripId, target.itemId, target.photos);
  const { data: urls = {} } = useVisitPhotoUrls(
    tripId,
    target.photos.flatMap((p) => [p.photo_key, p.thumb_key]),
  );
  const online = useOnline();
  const saving = photos.progress !== null;
  useReportLock(saving, onLockChange);

  /** 사진을 먼저 올리고(바꿨으면) 별점 · 글을 저장해 닫는다. 사진이 실패하면 별점 · 글도 저장하지 않고 창에 남는다 */
  async function submit() {
    if (photos.changed && !online) {
      setError("오프라인이에요. 사진은 연결되면 저장해 주세요");
      return;
    }
    setError(null);
    const failed = await photos.save();
    if (failed) setError(failed);
    else onSave({ stars, body });
  }

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        if (!saving) void submit();
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
          disabled={saving}
          className="-mr-1.5 flex size-8 shrink-0 items-center justify-center text-ink-400"
        >
          <X className="size-5.5" strokeWidth={2} />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-5.5 overflow-y-auto px-5 pt-3.5 pb-4 lg:px-6">
        <RecordBlock label="별점">
          <RatingPicker
            value={stars}
            onPick={(n) => setStars(nextStars(stars, n))}
            size="sheet"
            emptyText="눌러서 매겨요"
            label="별점"
          />
        </RecordBlock>
        <RecordBlock label="기록" htmlFor="record-body">
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
        </RecordBlock>
        <PhotoPicker
          photos={photos}
          urls={urls}
          offline={!online}
          saving={saving}
          onOverflow={() => setError(`사진은 ${VISIT_PHOTO_LIMIT}장까지 붙일 수 있어요`)}
        />
      </div>
      {error && (
        <p role="alert" className="shrink-0 px-5 pt-2 text-[13px] text-destructive lg:px-6">
          {error}
        </p>
      )}
      <div className="flex shrink-0 gap-2 border-t border-divider px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:justify-end lg:border-t-0 lg:px-6 lg:pt-4 lg:pb-5">
        <Button
          type="button"
          variant="chip"
          size="cta"
          className="lg:h-10.5 lg:min-w-22 lg:text-[15px]"
          onClick={onClose}
          disabled={saving}
        >
          취소
        </Button>
        <Button
          type="submit"
          size="cta"
          className="flex-1 lg:h-10.5 lg:min-w-22 lg:flex-none lg:text-[15px]"
          disabled={saving}
        >
          {saving ? savingText(photos.progress) : "저장"}
        </Button>
      </div>
    </form>
  );
}

/** 저장 버튼 글 — 새 사진을 올리는 중이면 「사진 올리는 중 2/5」 */
function savingText(progress: { done: number; total: number } | null): string {
  if (!progress || progress.total === 0) return "저장 중…";
  return `사진 올리는 중 ${progress.done}/${progress.total}`;
}
