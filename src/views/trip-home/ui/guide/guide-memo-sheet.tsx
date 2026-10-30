"use client";

import { useState } from "react";

import { useHeldWhileClosing, useOpenCount } from "@/shared/lib/use-dialog-state";
import { Button } from "@/shared/ui/button";
import { SheetDialog } from "@/shared/ui/sheet-dialog";
import { Textarea } from "@/shared/ui/textarea";

import type { GuideActions } from "../../model/use-guide-actions";

/** 메모 글자 수 상한 — DB 도 1000 에서 막는다(0067) */
const MEMO_MAX = 1000;

type GuideMemoSheetProps = {
  memo: GuideActions["memo"];
  /** 장소 이름 · 지금 메모 */
  target: { name: string; memo: string | null } | null;
};

/** 이 여행에서 이 장소에 대한 메모 — 일행 누구나 고친다. 비우고 저장하면 지운다 */
export function GuideMemoSheet({ memo, target }: GuideMemoSheetProps) {
  const open = memo.placeId !== null && target !== null;
  const shown = useHeldWhileClosing(open, target);
  const openCount = useOpenCount(open);
  return (
    <SheetDialog open={open} onClose={memo.cancel} title="이 여행 메모" locked={memo.pending}>
      {shown && <MemoForm key={openCount} memo={memo} target={shown} />}
    </SheetDialog>
  );
}

type MemoFormProps = { memo: GuideActions["memo"]; target: { name: string; memo: string | null } };

/** 창 안 — 열 때마다 지금 메모에서 시작한다 */
function MemoForm({ memo, target }: MemoFormProps) {
  const [text, setText] = useState(target.memo ?? "");
  const changed = text.trim() !== (target.memo ?? "").trim();
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (changed) memo.save(text);
      }}
    >
      <p className="-mt-2 text-[13px] text-ink-400">{target.name} · 일행과 함께 봐요</p>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={MEMO_MAX}
        autoFocus
        rows={5}
        placeholder="예: 오픈 20분 전에 줄 서기, 현금만 받아요"
        aria-label="메모"
      />
      {memo.error && (
        <p className="text-[13px] text-destructive">저장하지 못했어요: {memo.error}</p>
      )}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="chip"
          size="form"
          className="flex-1"
          disabled={memo.pending}
          onClick={memo.cancel}
        >
          취소
        </Button>
        <Button type="submit" size="form" className="flex-2" disabled={!changed || memo.pending}>
          {memo.pending ? "저장하는 중…" : "저장"}
        </Button>
      </div>
    </form>
  );
}
