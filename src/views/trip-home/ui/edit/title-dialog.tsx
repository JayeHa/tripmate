"use client";

import { useState } from "react";

import { type Trip, useUpdateTripTitle } from "@/entities/trip";
import { useOpenCount } from "@/shared/lib/use-dialog-state";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/shared/ui/dialog";

/** 여행 제목 글자 수 상한 */
const TITLE_MAX = 30;

type TitleDialogProps = { trip: Trip; open: boolean; onClose: () => void };

/**
 * 여행 제목 수정 — 가운데 340 창. 밑줄 입력 · 「n/30」 · 아래 「취소 | 확인」.
 * 비었거나 30자를 넘으면 확인이 흐리다. 바뀌지 않았으면 저장하지 않고 닫는다
 */
export function TitleDialog({ trip, open, onClose }: TitleDialogProps) {
  const update = useUpdateTripTitle(trip.id);
  const openCount = useOpenCount(open);
  return (
    <Dialog open={open} locked={update.isPending} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[calc(100%-3rem)] gap-0 overflow-hidden rounded-[14px] p-0 sm:max-w-85"
      >
        <TitleForm key={openCount} trip={trip} update={update} onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
}

type TitleFormProps = {
  trip: Trip;
  update: ReturnType<typeof useUpdateTripTitle>;
  onClose: () => void;
};

/** 창 안 — 열 때마다 지금 제목에서 시작한다 */
function TitleForm({ trip, update, onClose }: TitleFormProps) {
  const [draft, setDraft] = useState(trip.title);
  const title = draft.trim();
  const valid = title.length > 0 && title.length <= TITLE_MAX;

  /** 확인 — 같은 제목이면 그냥 닫는다 */
  function save() {
    if (!valid || update.isPending) return;
    if (title === trip.title) return onClose();
    update.mutate(title, { onSuccess: onClose });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <div className="flex flex-col gap-1 px-6 pt-6.5 pb-2.5">
        <DialogTitle className="text-xl font-extrabold text-ink-900">여행 제목</DialogTitle>
        <DialogDescription className="text-[13px] text-ink-450">
          일행의 여행 제목도 함께 수정돼요.
        </DialogDescription>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={TITLE_MAX}
          autoFocus
          placeholder="도쿄 여행"
          aria-label="여행 제목"
          className="mt-5.5 border-b-[1.5px] border-primary bg-transparent pb-2.5 text-[17px] font-semibold text-ink-900 outline-none placeholder:text-ink-350"
        />
        <span className="self-end pt-1.5 text-xs text-ink-350">
          {draft.length}/{TITLE_MAX}
        </span>
        {update.error && (
          <p className="text-[13px] text-destructive">저장하지 못했어요: {update.error.message}</p>
        )}
      </div>
      <div className="grid grid-cols-2 border-t border-line-card">
        <button
          type="button"
          onClick={onClose}
          disabled={update.isPending}
          className="h-13 border-r border-line-card text-base text-ink-450"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={!valid || update.isPending}
          className="h-13 text-base font-bold text-primary disabled:text-primary-disabled"
        >
          확인
        </button>
      </div>
    </form>
  );
}
