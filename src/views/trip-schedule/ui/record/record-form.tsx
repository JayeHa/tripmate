"use client";

import { X } from "lucide-react";
import { useState } from "react";

import {
  cleanNoteBody,
  nextStars,
  RatingPicker,
  useVisitPhotoUrls,
  VISIT_NOTE_MAX,
  VISIT_PHOTO_LIMIT,
  type VisitPhoto,
} from "@/entities/schedule-item";
import { useReportLock } from "@/shared/lib/use-dialog-state";
import { useOnline } from "@/shared/lib/use-online";
import { Button } from "@/shared/ui/button";
import { DialogTitle } from "@/shared/ui/dialog";

import type { CrewMember } from "../../lib/crew";
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
  /** 이 일정의 기록 글 — 일행과 함께 쓴다(없으면 "") */
  body: string;
  /** 그 글의 updated_at(글이 없으면 null) — 저장할 때 「본 버전」 으로 보낸다 */
  noteAt: string | null;
  /** 이 일정의 기록 사진 — 일행이 올린 것까지(순서대로) */
  photos: readonly VisitPhoto[];
};

/** 저장할 값 — note 는 글을 바꿨을 때만(seen = 열 때 본 글의 updated_at) */
export type RecordDraft = {
  stars: number;
  note: { body: string; seen: string | null } | null;
};

/** 일행이 있는 여행에서만 보이는 것 — 「함께」 덧말과 사진을 올린 사람 */
export type RecordCrewProps = {
  shared: boolean;
  /** 사진을 올린 사람(null = 나, 방금 고른 사진). 그리지 않을 때는 null */
  uploader: (userId: string | null) => CrewMember | null;
};

type RecordFormProps = RecordCrewProps & {
  tripId: string;
  target: RecordTarget;
  onLockChange: (locked: boolean) => void;
  onClose: () => void;
  onSave: (draft: RecordDraft) => void;
};

/**
 * 창 안 — 머리 · 별점 · 기록 글 · 사진 · 하단 버튼.
 * 글 · 사진은 **열 때 본 값**(opened)에서 시작하고 그 값과 달라진 것만 저장한다. 창을 연 동안 일행이 고친 것이 실시간으로 들어와도
 * 지금 값과 비교하지 않는다 — 그러면 손대지 않은 글이 일행의 새 글을 옛 글로 되돌리고, 일행이 그사이 올린 사진을 「뺀 사진」 으로 지운다
 */
export function RecordForm({
  tripId,
  target,
  shared,
  uploader,
  onLockChange,
  onClose,
  onSave,
}: RecordFormProps) {
  const [opened] = useState(target);
  const [stars, setStars] = useState(opened.stars);
  const [body, setBody] = useState(opened.body);
  const [error, setError] = useState<string | null>(null);
  const photos = useRecordPhotos(tripId, opened.itemId, opened.photos);
  const { data: urls = {} } = useVisitPhotoUrls(
    tripId,
    opened.photos.flatMap((p) => [p.photo_key, p.thumb_key]),
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
    else {
      const note = cleanNoteBody(body) === opened.body ? null : { body, seen: opened.noteAt };
      onSave({ stars, note });
    }
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
            {opened.body || opened.photos.length > 0 ? "기록 수정" : "기록 남기기"}
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
        <RecordBlock
          label={shared ? "내 별점" : "별점"}
          sub={shared ? "일행은 각자 매겨요" : undefined}
        >
          <RatingPicker
            value={stars}
            onPick={(n) => setStars(nextStars(stars, n))}
            size="sheet"
            emptyText="눌러서 매겨요"
            label="별점"
          />
        </RecordBlock>
        <RecordBlock
          label="기록"
          sub={shared ? "일행과 함께 써요" : undefined}
          htmlFor="record-body"
        >
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
          shared={shared}
          uploader={uploader}
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
