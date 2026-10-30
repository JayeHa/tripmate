"use client";

import { useState } from "react";

import { useOpenCount, useReportLock } from "@/shared/lib/use-dialog-state";
import { Button } from "@/shared/ui/button";
import { SheetDialog } from "@/shared/ui/sheet-dialog";

import { TRANSPORT_NOTE_MAX, useTransportNoteForm } from "../../model/use-transport-note-form";

type NoteDialogProps = {
  tripId: string;
  open: boolean;
  note: string | null;
  onClose: () => void;
};

/** 교통카드 · 패스 메모 고치기 — 모바일 바텀시트 · PC 가운데 480, 열 때마다 지금 메모로 새로 그린다 */
export function NoteDialog({ tripId, open, note, onClose }: NoteDialogProps) {
  const count = useOpenCount(open);
  const [locked, setLocked] = useState(false);
  return (
    <SheetDialog open={open} onClose={onClose} title="교통카드 · 패스" locked={locked}>
      <NoteBody
        key={count}
        tripId={tripId}
        note={note}
        onClose={onClose}
        onLockChange={setLocked}
      />
    </SheetDialog>
  );
}

type NoteBodyProps = Omit<NoteDialogProps, "open"> & { onLockChange: (locked: boolean) => void };

/** 메모 칸 + 취소 | 저장 */
function NoteBody({ tripId, note, onClose, onLockChange }: NoteBodyProps) {
  const form = useTransportNoteForm(tripId, note, onClose);
  useReportLock(form.pending, onLockChange);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <span className="flex items-center justify-between text-[13px] font-bold text-ink-700">
          어떤 교통카드 · 패스를 쓰나요
          <span className="text-xs font-medium text-ink-350">
            {form.text.length}/{TRANSPORT_NOTE_MAX}
          </span>
        </span>
        <textarea
          value={form.text}
          onChange={(e) => form.setText(e.target.value)}
          maxLength={TRANSPORT_NOTE_MAX}
          rows={6}
          aria-label="교통카드 · 패스 메모"
          placeholder={"아이폰 지갑의 교통카드를 그대로 씁니다\n편의점에서도 결제됩니다"}
          className="w-full resize-none rounded-memo border border-line px-3.5 py-3 text-[15px]/relaxed text-ink-900 outline-none placeholder:text-ink-350 focus:border-primary"
        />
      </div>
      {form.error && <p className="text-[13px] text-destructive">{form.error}</p>}
      <div className="flex items-center gap-2">
        <Button
          variant="chip"
          size="form"
          className="ml-auto w-24"
          disabled={form.pending}
          onClick={onClose}
        >
          취소
        </Button>
        <Button size="form" className="w-36" disabled={form.pending} onClick={form.submit}>
          저장
        </Button>
      </div>
    </div>
  );
}
