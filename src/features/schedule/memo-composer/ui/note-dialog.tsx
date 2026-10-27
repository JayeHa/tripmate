"use client";

import { useState } from "react";

import { MEMO_MAX, type ScheduleItem } from "@/entities/schedule-item";
import { useReportLock } from "@/shared/lib/use-dialog-state";
import { Button } from "@/shared/ui/button";
import { PinToggle } from "@/shared/ui/pin-toggle";
import { SheetDialog } from "@/shared/ui/sheet-dialog";
import { TimeField } from "@/shared/ui/time-field";

import { useNoteEdit } from "../model/use-note-edit";
import { DeleteMemoButton } from "./delete-memo-button";

type NoteDialogProps = { tripId: string; item: ScheduleItem; onClose: () => void };

/**
 * 날짜 메모(타임라인의 메모 줄) 고치기 — 일정 상세 대신 연다. 머리 없이 ✕ 만, 「시간 (선택)」 + 「홈에 고정」 · 「메모」(8줄 · 500자) ·
 * 왼쪽 「삭제」 · 취소 | 저장. 저장하면 같은 자리의 메모가 바뀐다
 */
export function NoteDialog(props: NoteDialogProps) {
  const [locked, setLocked] = useState(false);
  return (
    <SheetDialog open onClose={props.onClose} ariaTitle="날짜 메모" locked={locked}>
      <NoteBody {...props} onLockChange={setLocked} />
    </SheetDialog>
  );
}

type NoteBodyProps = NoteDialogProps & { onLockChange: (locked: boolean) => void };

/** 칸 묶음. 상태는 useNoteEdit */
function NoteBody({ tripId, item, onClose, onLockChange }: NoteBodyProps) {
  const form = useNoteEdit(tripId, item, onClose);
  useReportLock(form.locked, onLockChange);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-bold text-ink-700">
          시간 <span className="font-medium text-ink-350">(선택)</span>
        </span>
        <div className="flex items-center gap-2">
          <div className="w-40">
            <TimeField
              value={form.draft.time}
              onChange={(time) => form.set("time", time)}
              aria-label="메모 시간"
            />
          </div>
          <PinToggle
            pinned={form.draft.pinned}
            onToggle={() => form.set("pinned", !form.draft.pinned)}
            disabled={!form.pinReady}
            className="ml-auto"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="flex items-center justify-between text-[13px] font-bold text-ink-700">
          메모
          <span className="text-xs font-medium text-ink-350">
            {form.draft.text.length}/{MEMO_MAX}
          </span>
        </span>
        <textarea
          value={form.draft.text}
          onChange={(e) => form.set("text", e.target.value)}
          maxLength={MEMO_MAX}
          rows={8}
          aria-label="메모"
          className="w-full resize-none rounded-memo border border-line px-3.5 py-3 text-[15px]/relaxed text-ink-900 outline-none focus:border-primary"
        />
      </div>
      {form.error && <p className="text-[13px] text-destructive">{form.error}</p>}
      <div className="flex items-center gap-2">
        <DeleteMemoButton disabled={form.pending} onConfirm={form.destroy} />
        <Button
          variant="chip"
          size="form"
          className="ml-auto w-24"
          disabled={form.locked}
          onClick={onClose}
        >
          취소
        </Button>
        <Button
          size="form"
          className="w-36"
          disabled={!form.canSave || form.pending}
          onClick={form.save}
        >
          저장
        </Button>
      </div>
    </div>
  );
}
